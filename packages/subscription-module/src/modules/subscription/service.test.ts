import { describe, expect, it, vi } from "vitest"

import SubscriptionModuleService, {
  advanceRenewalDate,
} from "./service"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"

const BASE_SUBSCRIPTION = {
  id: "sub_1",
  store_id: STORE_A,
  customer_id: "cus_1",
  product_id: "prod_1",
  variant_id: "variant_1",
  interval: "monthly" as const,
  status: "active" as const,
  stripe_subscription_id: null,
  current_period_start: new Date("2026-06-01T00:00:00.000Z"),
  current_period_end: new Date("2026-07-01T00:00:00.000Z"),
  next_renewal_at: new Date("2026-07-01T00:00:00.000Z"),
  cancelled_at: null,
  pause_requested_at: null,
  created_at: new Date("2026-06-01T00:00:00.000Z"),
  updated_at: new Date("2026-06-01T00:00:00.000Z"),
  deleted_at: null,
}

function createServiceStub(
  overrides: Record<string, unknown>
): SubscriptionModuleService {
  const withTenant = vi.fn(
    async <T>(
      _storeId: string,
      fn: (context: { transactionManager: unknown }) => Promise<T>
    ): Promise<T> => fn({ transactionManager: {} })
  )

  const svc = Object.create(SubscriptionModuleService.prototype) as SubscriptionModuleService
  Object.assign(svc, { withTenant, ...overrides })
  return svc
}

describe("advanceRenewalDate", (): void => {
  it("advances monthly intervals", (): void => {
    const from = new Date("2026-01-15T12:00:00.000Z")
    const next = advanceRenewalDate(from, "monthly")
    expect(next.toISOString()).toBe("2026-02-15T12:00:00.000Z")
  })

  it("advances biweekly intervals", (): void => {
    const from = new Date("2026-01-01T00:00:00.000Z")
    const next = advanceRenewalDate(from, "biweekly")
    expect(next.toISOString()).toBe("2026-01-15T00:00:00.000Z")
  })
})

describe("SubscriptionModuleService", (): void => {
  it("getSubscriptionConfig returns null when no row exists", async (): Promise<void> => {
    const listMercflowSubscriptionConfigs = vi.fn().mockResolvedValue([])
    const svc = createServiceStub({ listMercflowSubscriptionConfigs })

    const config = await svc.getSubscriptionConfig(STORE_A)
    expect(config).toBeNull()
  })

  it("getSubscriptionConfig maps persisted row", async (): Promise<void> => {
    const listMercflowSubscriptionConfigs = vi.fn().mockResolvedValue([
      {
        id: "cfg_1",
        store_id: STORE_A,
        club_enabled: true,
        club_stripe_product_id: null,
        club_price_monthly: "99",
        club_price_annual: null,
        club_fallback_discount_pct: "10",
        club_name: "VIP Klub",
        created_at: new Date("2026-06-01T00:00:00.000Z"),
        updated_at: new Date("2026-06-01T00:00:00.000Z"),
        deleted_at: null,
      },
    ])
    const svc = createServiceStub({ listMercflowSubscriptionConfigs })

    const config = await svc.getSubscriptionConfig(STORE_A)
    expect(config?.club_enabled).toBe(true)
    expect(config?.club_name).toBe("VIP Klub")
  })

  it("createSubscription persists tenant-scoped row", async (): Promise<void> => {
    const createMercflowSubscriptions = vi.fn().mockResolvedValue([BASE_SUBSCRIPTION])
    const svc = createServiceStub({ createMercflowSubscriptions })

    const row = await svc.createSubscription(STORE_A, {
      customer_id: "cus_1",
      product_id: "prod_1",
      variant_id: "variant_1",
      interval: "monthly",
      current_period_start: new Date("2026-06-01T00:00:00.000Z"),
      current_period_end: new Date("2026-07-01T00:00:00.000Z"),
      next_renewal_at: new Date("2026-07-01T00:00:00.000Z"),
    })

    expect(row.id).toBe("sub_1")
    expect(createMercflowSubscriptions).toHaveBeenCalledWith(
      expect.objectContaining({ store_id: STORE_A, status: "active" }),
      expect.any(Object)
    )
  })

  it("listSubscriptions filters by status and customer_id", async (): Promise<void> => {
    const listAndCountMercflowSubscriptions = vi
      .fn()
      .mockResolvedValue([[BASE_SUBSCRIPTION], 1])
    const svc = createServiceStub({ listAndCountMercflowSubscriptions })

    const result = await svc.listSubscriptions(
      STORE_A,
      { status: "active", customer_id: "cus_1" },
      { limit: 10, offset: 0 }
    )

    expect(result.count).toBe(1)
    expect(result.subscriptions[0]?.status).toBe("active")
    expect(listAndCountMercflowSubscriptions).toHaveBeenCalledWith(
      { store_id: STORE_A, status: "active", customer_id: "cus_1" },
      expect.objectContaining({ take: 10, skip: 0 }),
      expect.any(Object)
    )
  })

  it("getSubscription returns renewal logs", async (): Promise<void> => {
    const listMercflowSubscriptions = vi.fn().mockResolvedValue([BASE_SUBSCRIPTION])
    const listMercflowSubscriptionRenewalLogs = vi.fn().mockResolvedValue([
      {
        id: "log_1",
        subscription_id: "sub_1",
        order_id: "order_1",
        amount: "99.00",
        currency: "dkk",
        status: "success",
        stripe_payment_intent_id: null,
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ])
    const svc = createServiceStub({
      listMercflowSubscriptions,
      listMercflowSubscriptionRenewalLogs,
    })

    const detail = await svc.getSubscription(STORE_A, "sub_1")

    expect(detail.subscription.id).toBe("sub_1")
    expect(detail.renewal_logs).toHaveLength(1)
    expect(detail.renewal_logs[0]?.order_id).toBe("order_1")
  })

  it("pauseSubscription requires active status", async (): Promise<void> => {
    const listMercflowSubscriptions = vi.fn().mockResolvedValue([
      { ...BASE_SUBSCRIPTION, status: "paused" },
    ])
    const svc = createServiceStub({ listMercflowSubscriptions })

    await expect(svc.pauseSubscription(STORE_A, "sub_1")).rejects.toMatchObject({
      type: "invalid_data",
    })
  })

  it("pauseSubscription updates status to paused", async (): Promise<void> => {
    const listMercflowSubscriptions = vi.fn().mockResolvedValue([BASE_SUBSCRIPTION])
    const updateMercflowSubscriptions = vi.fn().mockResolvedValue([
      { ...BASE_SUBSCRIPTION, status: "paused", pause_requested_at: new Date() },
    ])
    const svc = createServiceStub({ listMercflowSubscriptions, updateMercflowSubscriptions })

    const row = await svc.pauseSubscription(STORE_A, "sub_1")

    expect(row.status).toBe("paused")
    expect(updateMercflowSubscriptions).toHaveBeenCalledWith(
      { id: "sub_1", store_id: STORE_A },
      expect.objectContaining({ status: "paused" }),
      expect.any(Object)
    )
  })

  it("cancelSubscription rejects already cancelled", async (): Promise<void> => {
    const listMercflowSubscriptions = vi.fn().mockResolvedValue([
      { ...BASE_SUBSCRIPTION, status: "cancelled" },
    ])
    const svc = createServiceStub({ listMercflowSubscriptions })

    await expect(svc.cancelSubscription(STORE_A, "sub_1")).rejects.toMatchObject({
      type: "invalid_data",
    })
  })

  it("cancelSubscription sets cancelled_at", async (): Promise<void> => {
    const listMercflowSubscriptions = vi.fn().mockResolvedValue([BASE_SUBSCRIPTION])
    const updateMercflowSubscriptions = vi.fn().mockResolvedValue([
      { ...BASE_SUBSCRIPTION, status: "cancelled", cancelled_at: new Date() },
    ])
    const svc = createServiceStub({ listMercflowSubscriptions, updateMercflowSubscriptions })

    const row = await svc.cancelSubscription(STORE_A, "sub_1")

    expect(row.status).toBe("cancelled")
    expect(updateMercflowSubscriptions).toHaveBeenCalledWith(
      { id: "sub_1", store_id: STORE_A },
      expect.objectContaining({ status: "cancelled" }),
      expect.any(Object)
    )
  })

  it("resumeSubscription requires paused status", async (): Promise<void> => {
    const listMercflowSubscriptions = vi.fn().mockResolvedValue([BASE_SUBSCRIPTION])
    const svc = createServiceStub({ listMercflowSubscriptions })

    await expect(svc.resumeSubscription(STORE_A, "sub_1")).rejects.toMatchObject({
      type: "invalid_data",
    })
  })

  it("resumeSubscription reactivates and advances next_renewal_at", async (): Promise<void> => {
    const listMercflowSubscriptions = vi.fn().mockResolvedValue([
      { ...BASE_SUBSCRIPTION, status: "paused" },
    ])
    const updateMercflowSubscriptions = vi.fn().mockImplementation(
      async (_filter, patch: Record<string, unknown>) => [
        {
          ...BASE_SUBSCRIPTION,
          status: "active",
          pause_requested_at: null,
          next_renewal_at: patch.next_renewal_at,
        },
      ]
    )
    const svc = createServiceStub({ listMercflowSubscriptions, updateMercflowSubscriptions })

    const row = await svc.resumeSubscription(STORE_A, "sub_1")

    expect(row.status).toBe("active")
    expect(updateMercflowSubscriptions).toHaveBeenCalledWith(
      { id: "sub_1", store_id: STORE_A },
      expect.objectContaining({ status: "active", pause_requested_at: null }),
      expect.any(Object)
    )
  })

  it("listDueRenewals queries active subscriptions due on or before asOf", async (): Promise<void> => {
    const asOf = new Date("2026-07-01T12:00:00.000Z")
    const listMercflowSubscriptions = vi.fn().mockResolvedValue([BASE_SUBSCRIPTION])
    const svc = createServiceStub({ listMercflowSubscriptions })
    const rows = await svc.listDueRenewals(STORE_A, asOf)
    expect(rows).toHaveLength(1)
    expect(listMercflowSubscriptions).toHaveBeenCalledWith(
      { store_id: STORE_A, status: "active", next_renewal_at: { $lte: asOf } },
      expect.objectContaining({ order: { next_renewal_at: "ASC" } }),
      expect.any(Object)
    )
  })

  it("completeRenewalSuccess logs success renewal", async (): Promise<void> => {
    const listMercflowSubscriptions = vi.fn().mockResolvedValue([BASE_SUBSCRIPTION])
    const updateMercflowSubscriptions = vi.fn().mockResolvedValue([BASE_SUBSCRIPTION])
    const createMercflowSubscriptionRenewalLogs = vi.fn().mockResolvedValue([{ id: "log_1" }])
    const svc = createServiceStub({
      listMercflowSubscriptions,
      updateMercflowSubscriptions,
      createMercflowSubscriptionRenewalLogs,
    })
    await svc.completeRenewalSuccess(STORE_A, "sub_1", {
      order_id: "order_1",
      amount: 9900,
      currency: "dkk",
      stripe_payment_intent_id: "pi_123",
      renewed_at: new Date("2026-07-01T00:00:00.000Z"),
    })
    expect(createMercflowSubscriptionRenewalLogs).toHaveBeenCalledWith(
      expect.objectContaining({ status: "success" }),
      expect.any(Object)
    )
  })

  it("recordRenewalFailure marks past_due", async (): Promise<void> => {
    const listMercflowSubscriptions = vi.fn().mockResolvedValue([BASE_SUBSCRIPTION])
    const updateMercflowSubscriptions = vi.fn().mockResolvedValue([
      { ...BASE_SUBSCRIPTION, status: "past_due" },
    ])
    const createMercflowSubscriptionRenewalLogs = vi.fn().mockResolvedValue([{ id: "log_2" }])
    const svc = createServiceStub({
      listMercflowSubscriptions,
      updateMercflowSubscriptions,
      createMercflowSubscriptionRenewalLogs,
    })
    const row = await svc.recordRenewalFailure(STORE_A, "sub_1", {
      order_id: "order_1",
      amount: 9900,
      currency: "dkk",
      error_message: "card_declined",
    })
    expect(row.status).toBe("past_due")
  })

  it("updateRenewalTimestamp patches next_renewal_at", async (): Promise<void> => {
    const listMercflowSubscriptions = vi.fn().mockResolvedValue([BASE_SUBSCRIPTION])
    const nextRenewal = new Date("2026-08-01T00:00:00.000Z")
    const updateMercflowSubscriptions = vi.fn().mockResolvedValue([
      { ...BASE_SUBSCRIPTION, next_renewal_at: nextRenewal },
    ])
    const svc = createServiceStub({ listMercflowSubscriptions, updateMercflowSubscriptions })

    const row = await svc.updateRenewalTimestamp(STORE_A, "sub_1", {
      next_renewal_at: nextRenewal,
    })

    expect(row.next_renewal_at).toEqual(nextRenewal)
    expect(updateMercflowSubscriptions).toHaveBeenCalledWith(
      { id: "sub_1", store_id: STORE_A },
      { next_renewal_at: nextRenewal },
      expect.any(Object)
    )
  })
})
