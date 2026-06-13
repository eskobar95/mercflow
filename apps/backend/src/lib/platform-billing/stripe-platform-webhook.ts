import type Stripe from "stripe"

import {
  findTenantIdByInviteTokenHash,
  redeemPlatformInviteByTokenHash,
} from "../platform-db/redeem-platform-invite"
import { suspendPlatformTenant } from "../platform-tenants/suspend-tenant"
import {
  getStripePlatformClient,
  getStripePlatformWebhookSecret,
} from "./stripe-platform-client"

export type StripePlatformWebhookResult =
  | { handled: true; action: string }
  | { handled: false }

function readInviteTokenHash(
  metadata: Stripe.Metadata | null | undefined,
): string | null {
  const value = metadata?.invite_token_hash
  return typeof value === "string" && value.length > 0 ? value : null
}

export async function handleStripePlatformWebhookEvent(
  event: Stripe.Event,
): Promise<StripePlatformWebhookResult> {
  if (event.type === "customer.subscription.created") {
    const subscription = event.data.object as Stripe.Subscription
    const inviteTokenHash = readInviteTokenHash(subscription.metadata)
    if (!inviteTokenHash) {
      return { handled: false }
    }

    const existingTenantId = await findTenantIdByInviteTokenHash(inviteTokenHash)
    if (existingTenantId) {
      return { handled: true, action: "invite_already_redeemed" }
    }

    return { handled: true, action: "subscription_created_pending_provision" }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription
    const inviteTokenHash = readInviteTokenHash(subscription.metadata)
    if (!inviteTokenHash) {
      return { handled: false }
    }

    const tenantId = await findTenantIdByInviteTokenHash(inviteTokenHash)
    if (!tenantId) {
      return { handled: true, action: "subscription_deleted_no_tenant" }
    }

    await suspendPlatformTenant(tenantId, "stripe-platform-webhook@system")
    return { handled: true, action: "tenant_suspended" }
  }

  return { handled: false }
}

export function constructStripePlatformWebhookEvent(
  rawBody: string | Buffer,
  signature: string,
): Stripe.Event {
  const webhookSecret = getStripePlatformWebhookSecret()
  if (!webhookSecret) {
    throw new Error("STRIPE_PLATFORM_WEBHOOK_SECRET is not configured")
  }

  const stripe = getStripePlatformClient()
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
}

export async function markInviteRedeemedFromStripeCustomer(input: {
  inviteTokenHash: string
  tenantId: string
}): Promise<void> {
  await redeemPlatformInviteByTokenHash(input)
}
