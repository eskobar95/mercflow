import type { IPaymentProvider } from "@mercflow/payment-module/types"

import { buildRenewalIdempotencyKey } from "../lib/build-renewal-idempotency-key"
import { isPaymentIntentSuccess } from "../lib/is-payment-intent-success"
import type { ChargeSubscriptionJobPayload, HandleRenewalFailureJobPayload } from "../types"
import type { SubscriptionEventEmitter } from "./emit-subscription-event"

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
  resolvePaymentProvider: (storeId: string) => Promise<IPaymentProvider | null>
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
  const provider = await deps.resolvePaymentProvider(payload.storeId)

  if (provider === null) {
    await deps.enqueueRenewalFailure({
      storeId: payload.storeId,
      subscriptionId: payload.subscriptionId,
      orderId: orderDraft.orderId,
      amount: orderDraft.amount,
      currency: orderDraft.currency,
      errorMessage: "Payment provider is not configured for this store",
    })
    return
  }

  const idempotencyKey = buildRenewalIdempotencyKey(
    payload.subscriptionId,
    payload.nextRenewalAt
  )

  let chargeResult: { paymentIntentId: string; status: string }
  try {
    chargeResult = await provider.chargeSubscription({
      customerId: paymentContext.stripeCustomerId,
      amount: orderDraft.amount,
      currency: orderDraft.currency,
      idempotencyKey,
      paymentMethodId: paymentContext.paymentMethodId,
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

  if (!isPaymentIntentSuccess(chargeResult.status)) {
    await deps.enqueueRenewalFailure({
      storeId: payload.storeId,
      subscriptionId: payload.subscriptionId,
      orderId: orderDraft.orderId,
      amount: orderDraft.amount,
      currency: orderDraft.currency,
      stripePaymentIntentId: chargeResult.paymentIntentId,
      errorMessage: `PaymentIntent status: ${chargeResult.status}`,
    })
    return
  }

  await deps.completeRenewalSuccess(payload.storeId, payload.subscriptionId, {
    order_id: orderDraft.orderId,
    amount: orderDraft.amount,
    currency: orderDraft.currency,
    stripe_payment_intent_id: chargeResult.paymentIntentId,
    renewed_at: new Date(payload.nextRenewalAt),
  })

  await deps.events.emitRenewed({
    storeId: payload.storeId,
    subscriptionId: payload.subscriptionId,
    orderId: orderDraft.orderId,
    amount: orderDraft.amount,
    currency: orderDraft.currency,
    stripePaymentIntentId: chargeResult.paymentIntentId,
  })
}
