import type { HandleRenewalFailureJobPayload, SubscriptionDomainEventPayload } from "../types"
import type { SubscriptionEventEmitter } from "./emit-subscription-event"

export type HandleRenewalFailureDeps = {
  recordRenewalFailure: (
    storeId: string,
    subscriptionId: string,
    input: {
      order_id: string
      amount: number
      currency: string
      stripe_payment_intent_id?: string | null
      error_message: string
    }
  ) => Promise<unknown>
  events: SubscriptionEventEmitter
}

export async function handleRenewalFailure(
  deps: HandleRenewalFailureDeps,
  payload: HandleRenewalFailureJobPayload
): Promise<void> {
  await deps.recordRenewalFailure(payload.storeId, payload.subscriptionId, {
    order_id: payload.orderId,
    amount: payload.amount,
    currency: payload.currency,
    stripe_payment_intent_id: payload.stripePaymentIntentId ?? null,
    error_message: payload.errorMessage,
  })

  const eventPayload: SubscriptionDomainEventPayload = {
    storeId: payload.storeId,
    subscriptionId: payload.subscriptionId,
    orderId: payload.orderId,
    amount: payload.amount,
    currency: payload.currency,
    stripePaymentIntentId: payload.stripePaymentIntentId ?? null,
    errorMessage: payload.errorMessage,
  }

  await deps.events.emitRenewalFailed(eventPayload)
}
