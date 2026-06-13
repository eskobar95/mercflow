import type Stripe from "stripe"

import {
  findTenantIdByInviteTokenHash,
  redeemPlatformInviteByTokenHash,
} from "../platform-db/redeem-platform-invite"
import {
  updatePlatformTenantBillingStatus,
} from "../platform-db/platform-tenant-billing"
import {
  readInviteTokenHash,
  readSubscriptionIdFromInvoice,
  resolveStoreIdFromSubscription,
} from "./resolve-stripe-store-id"
import { getStripePlatformClient } from "./stripe-platform-client"
import { writeBillingAuditLog } from "./write-billing-audit-log"

export type StripePlatformWebhookResult =
  | { handled: true; action: string }
  | { handled: false }

function readCurrentPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const periodEnd = subscription.current_period_end
  if (typeof periodEnd === "number") {
    return new Date(periodEnd * 1000)
  }

  return null
}

async function fetchStripeCustomer(
  customerId: string,
): Promise<Stripe.Customer | null> {
  const stripe = getStripePlatformClient()

  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) {
      return null
    }

    return customer
  } catch {
    return null
  }
}

async function fetchStripeSubscription(
  subscriptionId: string,
): Promise<Stripe.Subscription | null> {
  const stripe = getStripePlatformClient()

  try {
    return await stripe.subscriptions.retrieve(subscriptionId)
  } catch {
    return null
  }
}

async function syncBillingStatusFromSubscription(input: {
  eventType: string
  subscription: Stripe.Subscription
  customer?: Stripe.Customer | null
  statusOverride?: string
}): Promise<StripePlatformWebhookResult> {
  const customer =
    input.customer ??
    (typeof input.subscription.customer === "string"
      ? await fetchStripeCustomer(input.subscription.customer)
      : input.subscription.customer && !("deleted" in input.subscription.customer)
        ? input.subscription.customer
        : null)

  const resolved = await resolveStoreIdFromSubscription(
    input.subscription,
    customer,
  )

  if (!resolved) {
    return { handled: false }
  }

  const subscriptionStatus =
    input.statusOverride ?? input.subscription.status

  const updated = await updatePlatformTenantBillingStatus(resolved.storeId, {
    subscription_status: subscriptionStatus,
    current_period_end: readCurrentPeriodEnd(input.subscription),
  })

  if (!updated) {
    return { handled: true, action: "billing_row_missing" }
  }

  await writeBillingAuditLog({
    action: "billing_status_changed",
    entity_id: resolved.storeId,
    metadata: {
      stripe_event_type: input.eventType,
      subscription_id: input.subscription.id,
      subscription_status: subscriptionStatus,
      resolution_source: resolved.source,
    },
  })

  return { handled: true, action: "billing_status_synced" }
}

async function syncBillingFromInvoiceEvent(input: {
  eventType: string
  invoice: Stripe.Invoice
  statusOverride: string
}): Promise<StripePlatformWebhookResult> {
  const subscriptionId = readSubscriptionIdFromInvoice(input.invoice)
  if (!subscriptionId) {
    return { handled: false }
  }

  const subscription = await fetchStripeSubscription(subscriptionId)
  if (!subscription) {
    return { handled: false }
  }

  return syncBillingStatusFromSubscription({
    eventType: input.eventType,
    subscription,
    statusOverride: input.statusOverride,
  })
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

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription
    return syncBillingStatusFromSubscription({
      eventType: event.type,
      subscription,
    })
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription
    return syncBillingStatusFromSubscription({
      eventType: event.type,
      subscription,
      statusOverride: "canceled",
    })
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice
    return syncBillingFromInvoiceEvent({
      eventType: event.type,
      invoice,
      statusOverride: "past_due",
    })
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice
    return syncBillingFromInvoiceEvent({
      eventType: event.type,
      invoice,
      statusOverride: "active",
    })
  }

  return { handled: false }
}

export { constructStripePlatformWebhookEvent } from "./stripe-platform-webhook-verify"

export async function markInviteRedeemedFromStripeCustomer(input: {
  inviteTokenHash: string
  tenantId: string
}): Promise<void> {
  await redeemPlatformInviteByTokenHash(input)
}
