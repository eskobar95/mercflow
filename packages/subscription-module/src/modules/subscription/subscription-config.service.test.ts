import { describe, expect, it, vi } from "vitest"

import SubscriptionModuleService from "./service"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"

const BASE_CONFIG = {
  id: "scfg_1",
  store_id: STORE_A,
  club_enabled: false,
  club_stripe_product_id: null,
  club_price_monthly: null,
  club_price_annual: null,
  club_fallback_discount_pct: null,
  club_name: null,
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

describe("SubscriptionModuleService subscription config", (): void => {
  it("getOrCreateSubscriptionConfig returns existing row", async (): Promise<void> => {
    const listMercflowSubscriptionConfigs = vi.fn().mockResolvedValue([BASE_CONFIG])
    const svc = createServiceStub({ listMercflowSubscriptionConfigs })

    const row = await svc.getOrCreateSubscriptionConfig(STORE_A)

    expect(row.id).toBe("scfg_1")
    expect(listMercflowSubscriptionConfigs).toHaveBeenCalled()
  })

  it("getOrCreateSubscriptionConfig creates default row when missing", async (): Promise<void> => {
    const listMercflowSubscriptionConfigs = vi.fn().mockResolvedValue([])
    const createMercflowSubscriptionConfigs = vi.fn().mockResolvedValue([BASE_CONFIG])
    const svc = createServiceStub({
      listMercflowSubscriptionConfigs,
      createMercflowSubscriptionConfigs,
    })

    const row = await svc.getOrCreateSubscriptionConfig(STORE_A)

    expect(row.store_id).toBe(STORE_A)
    expect(createMercflowSubscriptionConfigs).toHaveBeenCalledWith(
      expect.objectContaining({ store_id: STORE_A, club_enabled: false }),
      expect.any(Object)
    )
  })

  it("upsertSubscriptionConfig disables club without Stripe sync", async (): Promise<void> => {
    const listMercflowSubscriptionConfigs = vi.fn().mockResolvedValue([BASE_CONFIG])
    const updateMercflowSubscriptionConfigs = vi
      .fn()
      .mockResolvedValue([{ ...BASE_CONFIG, club_enabled: false }])
    const svc = createServiceStub({
      listMercflowSubscriptionConfigs,
      updateMercflowSubscriptionConfigs,
    })

    const row = await svc.upsertSubscriptionConfig(
      STORE_A,
      { club_enabled: false },
      {
        scope: { resolve: vi.fn() } as never,
        paymentService: { withClubStripeProductClient: vi.fn() } as never,
      }
    )

    expect(row.club_enabled).toBe(false)
    expect(updateMercflowSubscriptionConfigs).toHaveBeenCalled()
  })
})
