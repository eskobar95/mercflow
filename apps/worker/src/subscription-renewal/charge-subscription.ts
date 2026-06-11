import { buildRenewalIdempotencyKey } from "../lib/build-renewal-idempotency-key"
import { isPaymentIntentSuccess } from "../lib/is-payment-intent-success"
import type { ChargeSubscriptionJobPayload, HandleRenewalFailureJobPayload } from "../types"
import type { SubscriptionEventEmitter } from "./emit-subscription-event"
import type { StripePaymentIntentClient } from "./stripe-charge"
import { createRenewalPaymentIntent } from "./stripe-charge"

export type ChargeableSubscription = {
  id: string
  customer_id: string
  variant_id: string
  status: string
  next_renewal_at: string | Date
}

export type RenewalOrderDraft = {
  orderId: string
  amount: number
  currency: string
}

export type RenewalPaymentContext = {
  stripeCustomerId: string
  paymentMethodId: string
}

export type ChargeSubscriptionDeps = {
  getSubscription: (storeId: string, subscriptionId: string) => Promise<ChargeableSubscription>
  createRenewalOrderDraft: (
    storeId: string,
    subscription: ChargeableSubscription
  ) => Promise<RenewalOrderDraft>
  resolveRenewalPaymentContext: (
    storeId: string,
    subscription: ChargeableSubscription
  ) => Promise<RenewalPaymentContext>
  resolveStripeClient: (storeId: string) => Promise<StripePaymentIntentClient | null>
  completeRenewalSuccess: (
    storeId: string,
    subscriptionId: string,
    input: {
      order_id: string
      amount: number
      currency: string
      stripe_payment_intent_id: string
      renewed_at: Date
    }
  ) => Promise<unknown>
  enqueueRenewalFailure: (payload: HandleRenewalFailureJobPayload) => Promise<void>
  events: SubscriptionEventEmitter
}

export async function chargeSubscription(
  deps: ChargeSubscriptionDeps,
  payload: ChargeSubscriptionJobPayload
): Promise<void> {
  const subscription = await deps.getSubscription(payload.storeId, payload.subscriptionId)

  if (subscription.status !== "active") {
    return
  }

  const subscriptionRenewalAt =
    subscription.next_renewal_at instanceof Date
      ? subscription.next_renewal_at.toISOString()
      : String(subscription.next_renewal_at)

  if (subscriptionRenewalAt !== payload.nextRenewalAt) {
    return
  }

  const orderDraft = await deps.createRenewalOrderDraft(payload.storeId, subscription)
  const paymentContext = await deps.resolveRenewalPaymentContext(
    payload.storeId,
    subscription
  )
  const stripe = await deps.resolveStripeClient(payload.storeId)

  if (stripe === null) {
    await deps.enqueueRenewalFailure({
      storeId: payload.storeId,
      subscriptionId: payload.subscriptionId,
      orderId: orderDraft.orderId,
      amount: orderDraft.amount,
      currency: orderDraft.currency,
      errorMessage: "Stripe is not configured for this store",
    })
    return
  }

  const idempotencyKey = buildRenewalIdempotencyKey(
    payload.subscriptionId,
    payload.nextRenewalAt
  )

  let paymentIntent: { id: string; status: string }
  try {
    paymentIntent = await createRenewalPaymentIntent(stripe, {
      amount: orderDraft.amount,
      currency: orderDraft.currency,
      customerId: paymentContext.stripeCustomerId,
      paymentMethodId: paymentContext.paymentMethodId,
      idempotencyKey,
      metadata: {
        store_id: payload.storeId,
        subscription_id: payload.subscriptionId,
        order_id: orderDraft.orderId,
        renewal_at: payload.nextRenewalAt,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    await deps.enqueueRenewalFailure({
      storeId: payload.storeId,
      subscriptionId: payload.subscriptionId,
      orderId: orderDraft.orderId,
      amount: orderDraft.amount,
      currency: orderDraft.currency,
      errorMessage: message,
    })
    return
  }

  if (!isPaymentIntentSuccess(paymentIntent.status)) {
    await deps.enqueueRenewalFailure({
      storeId: payload.storeId,
      subscriptionId: payload.subscriptionId,
      orderId: orderDraft.orderId,
      amount: orderDraft.amount,
      currency: orderDraft.currency,
      stripePaymentIntentId: paymentIntent.id,
      errorMessage: `PaymentIntent status: ${paymentIntent.status}`,
    })
    return
  }

  await deps.completeRenewalSuccess(payload.storeId, payload.subscriptionId, {
    order_id: orderDraft.orderId,
    amount: orderDraft.amount,
    currency: orderDraft.currency,
    stripe_payment_intent_id: paymentIntent.id,
    renewed_at: new Date(payload.nextRenewalAt),
  })

  await deps.events.emitRenewed({
    storeId: payload.storeId,
    subscriptionId: payload.subscriptionId,
    orderId: orderDraft.orderId,
    amount: orderDraft.amount,
    currency: orderDraft.currency,
    stripePaymentIntentId: paymentIntent.id,
  })
}
