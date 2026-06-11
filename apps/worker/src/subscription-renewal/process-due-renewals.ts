import { buildChargeSubscriptionJobId } from "../lib/build-renewal-idempotency-key"
import type { ChargeSubscriptionJobPayload } from "../types"
import { CHARGE_SUBSCRIPTION_JOB, SUBSCRIPTION_RENEWAL_JOB_RETRY_OPTIONS } from "../types"

export type DueSubscription = {
  id: string
  next_renewal_at: string | Date
}

export type ProcessDueRenewalsDeps = {
  listStoreIds: () => Promise<readonly string[]>
  listDueRenewals: (storeId: string, asOf: Date) => Promise<DueSubscription[]>
  enqueueChargeSubscription: (
    jobId: string,
    payload: ChargeSubscriptionJobPayload
  ) => Promise<void>
}

export async function processDueRenewals(
  deps: ProcessDueRenewalsDeps,
  asOf: Date = new Date()
): Promise<{ enqueued: number }> {
  const storeIds = await deps.listStoreIds()
  let enqueued = 0

  for (const storeId of storeIds) {
    const dueSubscriptions = await deps.listDueRenewals(storeId, asOf)

    for (const subscription of dueSubscriptions) {
      const nextRenewalAt =
        subscription.next_renewal_at instanceof Date
          ? subscription.next_renewal_at.toISOString()
          : String(subscription.next_renewal_at)

      await deps.enqueueChargeSubscription(
        buildChargeSubscriptionJobId(storeId, subscription.id, nextRenewalAt),
        { storeId, subscriptionId: subscription.id, nextRenewalAt }
      )
      enqueued += 1
    }
  }

  return { enqueued }
}

export function createChargeSubscriptionEnqueue(
  queueAdd: (
    name: string,
    data: ChargeSubscriptionJobPayload,
    options: {
      jobId: string
      attempts: number
      backoff: { type: "exponential"; delay: number }
    }
  ) => Promise<unknown>
): ProcessDueRenewalsDeps["enqueueChargeSubscription"] {
  return async (jobId, payload) => {
    await queueAdd(CHARGE_SUBSCRIPTION_JOB, payload, {
      jobId,
      ...SUBSCRIPTION_RENEWAL_JOB_RETRY_OPTIONS,
    })
  }
}
