import type Stripe from "stripe"

import { findTenantIdByInviteTokenHash } from "../platform-db/redeem-platform-invite"

export type StoreIdResolutionSource =
  | "subscription_metadata"
  | "customer_metadata"
  | "invite_token_hash"

export type ResolveStoreIdResult = {
  storeId: string
  source: StoreIdResolutionSource
}

export function readStoreIdFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): string | null {
  const value = metadata?.store_id
  return typeof value === "string" && value.length > 0 ? value : null
}

export function readInviteTokenHash(
  metadata: Stripe.Metadata | null | undefined,
): string | null {
  const value = metadata?.invite_token_hash
  return typeof value === "string" && value.length > 0 ? value : null
}

export type ResolveStoreIdDeps = {
  findTenantIdByInviteTokenHash: (inviteTokenHash: string) => Promise<string | null>
  warn: (message: string) => void
}

const defaultDeps: ResolveStoreIdDeps = {
  findTenantIdByInviteTokenHash,
  warn: (message: string): void => {
    console.warn(message)
  },
}

export async function resolveStoreIdFromSubscription(
  subscription: Stripe.Subscription,
  customer: Stripe.Customer | null | undefined,
  deps: ResolveStoreIdDeps = defaultDeps,
): Promise<ResolveStoreIdResult | null> {
  const fromSubscription = readStoreIdFromMetadata(subscription.metadata)
  if (fromSubscription) {
    return { storeId: fromSubscription, source: "subscription_metadata" }
  }

  const fromCustomer = readStoreIdFromMetadata(customer?.metadata)
  if (fromCustomer) {
    return { storeId: fromCustomer, source: "customer_metadata" }
  }

  const inviteTokenHash = readInviteTokenHash(subscription.metadata)
  if (!inviteTokenHash) {
    return null
  }

  const tenantId = await deps.findTenantIdByInviteTokenHash(inviteTokenHash)
  if (!tenantId) {
    return null
  }

  deps.warn(
    `Stripe webhook resolved tenant via invite_token_hash fallback for subscription ${subscription.id}`,
  )

  return { storeId: tenantId, source: "invite_token_hash" }
}

export function readSubscriptionIdFromInvoice(
  invoice: Stripe.Invoice,
): string | null {
  const subscription = invoice.subscription
  if (typeof subscription === "string" && subscription.length > 0) {
    return subscription
  }

  if (
    subscription &&
    typeof subscription === "object" &&
    typeof subscription.id === "string"
  ) {
    return subscription.id
  }

  return null
}
