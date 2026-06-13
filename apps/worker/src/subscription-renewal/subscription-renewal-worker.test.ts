import { describe, expect, it, vi } from "vitest"

import { buildRenewalIdempotencyKey } from "../lib/build-renewal-idempotency-key"
import type { IPaymentProvider } from "@mercflow/payment-module/types"
import {
  CHARGE_SUBSCRIPTION_JOB,
  HANDLE_RENEWAL_FAILURE_JOB,
  SUBSCRIPTION_RENEWAL_FAILED_EVENT,
  SUBSCRIPTION_RENEWED_EVENT,
} from "../types"
import { chargeSubscription } from "./charge-subscription"
import { createSubscriptionEventEmitter } from "./emit-subscription-event"
import { handleRenewalFailure } from "./handle-renewal-failure"
import { processDueRenewals } from "./process-due-renewals"

const STORE_ID = "store_01KG0VBTT0714XV2CCTEBRVC47"
const SUBSCRIPTION_ID = "sub_1"
const NEXT_RENEWAL_AT = "2026-07-01T00:00:00.000Z"

const ACTIVE_SUBSCRIPTION = {
  id: SUBSCRIPTION_ID,
  customer_id: "cus_1",
  variant_id: "variant_1",
  status: "active" as const,
  next_renewal_at: NEXT_RENEWAL_AT,
}

function createMockPaymentProvider(
  chargeSubscriptionImpl: IPaymentProvider["chargeSubscription"]
): IPaymentProvider {
  return {
    providerKey: "stripe",
    createCheckoutSession: vi.fn(),
    capturePayment: vi.fn(),
    refundPayment: vi.fn(),
    createSubscription: vi.fn(),
    chargeSubscription: chargeSubscriptionImpl,
    pauseSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
    handleWebhook: vi.fn(),
    verifyWebhookSignature: vi.fn(),
  }
}

describe("processDueRenewals", (): void => {
  it("enqueues charge-subscription for each due subscription", async (): Promise<void> => {
    const enqueueChargeSubscription = vi.fn().mockResolvedValue(undefined)
    const result = await processDueRenewals(
      {
        listStoreIds: async () => [STORE_ID],
        listDueRenewals: async () => [ACTIVE_SUBSCRIPTION],
        enqueueChargeSubscription,
      },
      new Date("2026-07-01T12:00:00.000Z")
    )
    expect(result.enqueued).toBe(1)
    expect(enqueueChargeSubscription).toHaveBeenCalledWith(
      `${STORE_ID}:${SUBSCRIPTION_ID}:${NEXT_RENEWAL_AT}`,
      { storeId: STORE_ID, subscriptionId: SUBSCRIPTION_ID, nextRenewalAt: NEXT_RENEWAL_AT }
    )
  })
})

describe("chargeSubscription idempotency", (): void => {
  it("reuses existing PaymentIntent for duplicate idempotency key", async (): Promise<void> => {
    const keys: string[] = []
    const provider = createMockPaymentProvider(
      vi.fn(async (_params) => {
        const key = _params.idempotencyKey
        if (keys.includes(key)) {
          return { paymentIntentId: "pi_existing", status: "succeeded" }
        }
        keys.push(key)
        return { paymentIntentId: "pi_new", status: "succeeded" }
      })
    )

    const deps = {
      getSubscription: async () => ACTIVE_SUBSCRIPTION,
      createRenewalOrderDraft: async () => ({ orderId: "order_1", amount: 9900, currency: "dkk" }),
      resolveRenewalPaymentContext: async () => ({
        stripeCustomerId: "cus_stripe",
        paymentMethodId: "pm_123",
      }),
      resolvePaymentProvider: async () => provider,
      completeRenewalSuccess: vi.fn(),
      enqueueRenewalFailure: vi.fn(),
      events: { emitRenewed: vi.fn(), emitRenewalFailed: vi.fn() },
    }

    const payload = {
      storeId: STORE_ID,
      subscriptionId: SUBSCRIPTION_ID,
      nextRenewalAt: NEXT_RENEWAL_AT,
    }

    await chargeSubscription(deps, payload)
    await chargeSubscription(deps, payload)

    const key = buildRenewalIdempotencyKey(SUBSCRIPTION_ID, NEXT_RENEWAL_AT)
    expect(keys).toEqual([key])
    expect(provider.chargeSubscription).toHaveBeenCalledTimes(2)
  })
})

describe("chargeSubscription", (): void => {
  it("completes renewal and emits subscription.renewed on success", async (): Promise<void> => {
    const completeRenewalSuccess = vi.fn().mockResolvedValue(undefined)
    const emitRenewed = vi.fn().mockResolvedValue(undefined)
    const chargeSubscriptionFn = vi
      .fn()
      .mockResolvedValue({ paymentIntentId: "pi_ok", status: "succeeded" })
    await chargeSubscription(
      {
        getSubscription: async () => ACTIVE_SUBSCRIPTION,
        createRenewalOrderDraft: async () => ({ orderId: "order_1", amount: 9900, currency: "dkk" }),
        resolveRenewalPaymentContext: async () => ({
          stripeCustomerId: "cus_stripe",
          paymentMethodId: "pm_123",
        }),
        resolvePaymentProvider: async () => createMockPaymentProvider(chargeSubscriptionFn),
        completeRenewalSuccess,
        enqueueRenewalFailure: vi.fn(),
        events: { emitRenewed, emitRenewalFailed: vi.fn() },
      },
      { storeId: STORE_ID, subscriptionId: SUBSCRIPTION_ID, nextRenewalAt: NEXT_RENEWAL_AT }
    )
    expect(chargeSubscriptionFn).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 9900,
        idempotencyKey: buildRenewalIdempotencyKey(SUBSCRIPTION_ID, NEXT_RENEWAL_AT),
      })
    )
    expect(completeRenewalSuccess).toHaveBeenCalled()
    expect(emitRenewed).toHaveBeenCalled()
  })

  it("enqueues handle-renewal-failure on Stripe decline", async (): Promise<void> => {
    const enqueueRenewalFailure = vi.fn().mockResolvedValue(undefined)
    await chargeSubscription(
      {
        getSubscription: async () => ACTIVE_SUBSCRIPTION,
        createRenewalOrderDraft: async () => ({ orderId: "order_1", amount: 9900, currency: "dkk" }),
        resolveRenewalPaymentContext: async () => ({
          stripeCustomerId: "cus_stripe",
          paymentMethodId: "pm_123",
        }),
        resolvePaymentProvider: async () =>
          createMockPaymentProvider(
            vi.fn().mockResolvedValue({
              paymentIntentId: "pi_fail",
              status: "requires_payment_method",
            })
          ),
        completeRenewalSuccess: vi.fn(),
        enqueueRenewalFailure,
        events: { emitRenewed: vi.fn(), emitRenewalFailed: vi.fn() },
      },
      { storeId: STORE_ID, subscriptionId: SUBSCRIPTION_ID, nextRenewalAt: NEXT_RENEWAL_AT }
    )
    expect(enqueueRenewalFailure).toHaveBeenCalledWith(
      expect.objectContaining({ stripePaymentIntentId: "pi_fail" })
    )
  })
})

describe("handleRenewalFailure", (): void => {
  it("records failure and emits subscription.renewal_failed", async (): Promise<void> => {
    const recordRenewalFailure = vi.fn().mockResolvedValue({ status: "past_due" })
    const emitRenewalFailed = vi.fn().mockResolvedValue(undefined)
    await handleRenewalFailure(
      {
        recordRenewalFailure,
        events: { emitRenewed: vi.fn(), emitRenewalFailed },
      },
      {
        storeId: STORE_ID,
        subscriptionId: SUBSCRIPTION_ID,
        orderId: "order_1",
        amount: 9900,
        currency: "dkk",
        errorMessage: "card_declined",
      }
    )
    expect(recordRenewalFailure).toHaveBeenCalled()
    expect(emitRenewalFailed).toHaveBeenCalledWith(
      expect.objectContaining({ errorMessage: "card_declined" })
    )
  })
})

describe("subscription domain events", (): void => {
  it("enqueues subscription.renewal_failed", async (): Promise<void> => {
    const names: string[] = []
    const queue = {
      add: vi.fn(async (name: string) => {
        names.push(name)
        return { id: "job_1", name }
      }),
    }
    await createSubscriptionEventEmitter(queue).emitRenewalFailed({
      storeId: STORE_ID,
      subscriptionId: SUBSCRIPTION_ID,
      orderId: "order_1",
      errorMessage: "card_declined",
    })
    expect(names).toEqual([SUBSCRIPTION_RENEWAL_FAILED_EVENT])
  })

  it("enqueues subscription.renewed", async (): Promise<void> => {
    const names: string[] = []
    const queue = {
      add: vi.fn(async (name: string) => {
        names.push(name)
        return { id: "job_2", name }
      }),
    }
    await createSubscriptionEventEmitter(queue).emitRenewed({
      storeId: STORE_ID,
      subscriptionId: SUBSCRIPTION_ID,
      orderId: "order_1",
    })
    expect(names).toEqual([SUBSCRIPTION_RENEWED_EVENT])
  })
})

describe("job names", (): void => {
  it("uses stable BullMQ identifiers", (): void => {
    expect(CHARGE_SUBSCRIPTION_JOB).toBe("charge-subscription")
    expect(HANDLE_RENEWAL_FAILURE_JOB).toBe("handle-renewal-failure")
  })
})
