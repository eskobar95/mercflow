import type Stripe from "stripe"

import { upsertPlatformTenantBilling } from "../platform-db/platform-tenant-billing"
import { getStripePlatformClient } from "./stripe-platform-client"

export type ConfirmStripeSubscriptionInput = {
  storeId: string
  clerkOrgId: string
  stripeCustomerId: string
  stripeSubscriptionId: string | null
  stripePaymentIntentId: string
  billingCurrency: string
}

function readPlanTierFromSubscription(subscription: Stripe.Subscription): string {
  const tier = subscription.metadata?.plan_tier
  if (typeof tier === "string" && tier.length > 0) {
    return tier
  }

  const item = subscription.items.data[0]
  const price = item?.price
  if (price && typeof price !== "string") {
    const product = price.product
    if (product && typeof product !== "string" && !("deleted" in product && product.deleted === true)) {
      const productTier = product.metadata?.mercflow_tier
      if (typeof productTier === "string" && productTier.length > 0) {
        return productTier
      }
    }
  }

  return "standard"
}

function readBillingIntervalFromSubscription(subscription: Stripe.Subscription): string {
  const interval = subscription.metadata?.billing_interval
  if (typeof interval === "string" && interval.length > 0) {
    return interval
  }

  const item = subscription.items.data[0]
  const price = item?.price
  if (price && typeof price !== "string") {
    const priceInterval = price.metadata?.mercflow_interval ?? price.recurring?.interval
    if (typeof priceInterval === "string" && priceInterval.length > 0) {
      return priceInterval
    }
  }

  return "month"
}

function readPriceIdFromSubscription(subscription: Stripe.Subscription): string {
  const item = subscription.items.data[0]
  const price = item?.price
  if (price && typeof price !== "string") {
    return price.id
  }

  if (typeof price === "string") {
    return price
  }

  throw new Error("Stripe subscription is missing a price")
}

function readCurrentPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const periodEnd = subscription.current_period_end
  if (typeof periodEnd === "number") {
    return new Date(periodEnd * 1000)
  }

  return null
}

export async function confirmStripeSubscriptionForTenant(
  input: ConfirmStripeSubscriptionInput,
): Promise<void> {
  const stripe = getStripePlatformClient()

  let subscription: Stripe.Subscription | null = null

  if (input.stripeSubscriptionId) {
    subscription = await stripe.subscriptions.retrieve(input.stripeSubscriptionId, {
      expand: ["items.data.price.product"],
    })

    if (subscription.status !== "active" && subscription.status !== "trialing") {
      throw new Error(`Stripe subscription status is ${subscription.status}`)
    }
  } else {
    await stripe.paymentIntents.retrieve(input.stripePaymentIntentId)
    throw new Error("Stripe subscription id is required to confirm billing linkage")
  }

  const planTier = readPlanTierFromSubscription(subscription)
  const billingInterval = readBillingIntervalFromSubscription(subscription)
  const priceId = readPriceIdFromSubscription(subscription)

  await stripe.customers.update(input.stripeCustomerId, {
    metadata: {
      store_id: input.storeId,
      clerk_org_id: input.clerkOrgId,
      mercflow_platform: "true",
    },
  })

  await stripe.subscriptions.update(subscription.id, {
    metadata: {
      store_id: input.storeId,
      clerk_org_id: input.clerkOrgId,
      mercflow_platform: "true",
      plan_tier: planTier,
      billing_interval: billingInterval,
    },
  })

  await upsertPlatformTenantBilling({
    store_id: input.storeId,
    clerk_org_id: input.clerkOrgId,
    stripe_customer_id: input.stripeCustomerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan_tier: planTier,
    billing_interval: billingInterval,
    billing_currency: input.billingCurrency,
    subscription_status: "active",
    current_period_end: readCurrentPeriodEnd(subscription),
  })
}
