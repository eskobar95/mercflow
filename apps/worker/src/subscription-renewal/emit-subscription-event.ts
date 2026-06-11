import type { SubscriptionDomainEventPayload } from "../types"
import {
  SUBSCRIPTION_RENEWAL_FAILED_EVENT,
  SUBSCRIPTION_RENEWED_EVENT,
} from "../types"

export type SubscriptionEventEmitter = {
  emitRenewed: (payload: SubscriptionDomainEventPayload) => Promise<void>
  emitRenewalFailed: (payload: SubscriptionDomainEventPayload) => Promise<void>
}

export type SubscriptionEventQueue = {
  add: (
    name: string,
    data: SubscriptionDomainEventPayload,
    options?: Record<string, unknown>
  ) => Promise<unknown>
}

export function createSubscriptionEventEmitter(
  queue: SubscriptionEventQueue
): SubscriptionEventEmitter {
  return {
    async emitRenewed(payload: SubscriptionDomainEventPayload): Promise<void> {
      await queue.add(SUBSCRIPTION_RENEWED_EVENT, payload, {
        jobId: `${SUBSCRIPTION_RENEWED_EVENT}:${payload.storeId}:${payload.subscriptionId}:${payload.orderId ?? "none"}`,
        removeOnComplete: 100,
        removeOnFail: 100,
      })
    },
    async emitRenewalFailed(payload: SubscriptionDomainEventPayload): Promise<void> {
      await queue.add(SUBSCRIPTION_RENEWAL_FAILED_EVENT, payload, {
        jobId: `${SUBSCRIPTION_RENEWAL_FAILED_EVENT}:${payload.storeId}:${payload.subscriptionId}:${payload.orderId ?? "none"}`,
        removeOnComplete: 100,
        removeOnFail: 100,
      })
    },
  }
}
