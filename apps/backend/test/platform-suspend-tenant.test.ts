import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { suspendPlatformTenant } from "../src/lib/platform-tenants/suspend-tenant"

vi.mock("../src/lib/platform-db/platform-db", () => ({
  isPlatformDbConfigured: vi.fn(() => true),
  getPlatformDbPool: vi.fn(),
}))

vi.mock("../src/lib/platform-db/platform-tenant-billing", () => ({
  getPlatformTenantBillingByStoreId: vi.fn(),
  updatePlatformTenantBillingStatus: vi.fn(),
}))

vi.mock("../src/lib/platform-billing/stripe-platform-client", () => ({
  getStripePlatformClient: vi.fn(),
}))

import { getPlatformDbPool } from "../src/lib/platform-db/platform-db"
import {
  getPlatformTenantBillingByStoreId,
  updatePlatformTenantBillingStatus,
} from "../src/lib/platform-db/platform-tenant-billing"
import { getStripePlatformClient } from "../src/lib/platform-billing/stripe-platform-client"

describe("suspendPlatformTenant", () => {
  const mockQuery = vi.fn()
  const mockConnect = vi.fn()
  const mockRelease = vi.fn()
  const mockStripeCancel = vi.fn()

  beforeEach(() => {
    mockQuery.mockReset()
    mockConnect.mockReset()
    mockRelease.mockReset()
    mockStripeCancel.mockReset()

    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    })

    vi.mocked(getPlatformDbPool).mockReturnValue({
      connect: mockConnect,
    } as never)

    vi.mocked(getStripePlatformClient).mockReturnValue({
      subscriptions: {
        cancel: mockStripeCancel,
      },
    } as never)

    vi.mocked(getPlatformTenantBillingByStoreId).mockResolvedValue({
      store_id: "store_01",
      stripe_subscription_id: "sub_123",
    } as never)

    vi.mocked(updatePlatformTenantBillingStatus).mockResolvedValue(true)

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
        return { rowCount: 0, rows: [] }
      }

      if (sql.includes("UPDATE store")) {
        return { rowCount: 1, rows: [{ id: "store_01" }] }
      }

      if (sql.includes("SELECT DISTINCT ak.id")) {
        return { rowCount: 1, rows: [{ id: "apk_01" }] }
      }

      if (sql.includes("UPDATE api_key")) {
        return { rowCount: 1, rows: [] }
      }

      return { rowCount: 0, rows: [] }
    })

    mockStripeCancel.mockResolvedValue({ id: "sub_123", status: "canceled" })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("cancels Stripe subscription, disables store, revokes keys, and updates billing", async () => {
    const result = await suspendPlatformTenant("store_01", "ops@mercflow.test")

    expect(mockStripeCancel).toHaveBeenCalledWith("sub_123")
    expect(updatePlatformTenantBillingStatus).toHaveBeenCalledWith("store_01", {
      subscription_status: "canceled",
    })
    expect(result).toEqual({
      store_id: "store_01",
      revoked_api_key_ids: ["apk_01"],
      stripe_subscription_canceled: true,
      store_disabled: true,
      billing_status_updated: true,
      partial_errors: [],
    })
  })

  it("returns partial success when store disable fails after Stripe cancel", async () => {
    mockQuery.mockImplementation(async (sql: string) => {
      if (sql === "BEGIN" || sql === "ROLLBACK") {
        return { rowCount: 0, rows: [] }
      }

      if (sql.includes("UPDATE store")) {
        throw new Error("Store not found: store_01")
      }

      return { rowCount: 0, rows: [] }
    })

    const result = await suspendPlatformTenant("store_01", "ops@mercflow.test")

    expect(mockStripeCancel).toHaveBeenCalledWith("sub_123")
    expect(updatePlatformTenantBillingStatus).toHaveBeenCalled()
    expect(result.stripe_subscription_canceled).toBe(true)
    expect(result.store_disabled).toBe(false)
    expect(result.billing_status_updated).toBe(true)
    expect(result.partial_errors).toContain("Store not found: store_01")
  })

  it("throws when Stripe subscription cancel fails", async () => {
    mockStripeCancel.mockRejectedValue(new Error("Stripe API unavailable"))

    await expect(
      suspendPlatformTenant("store_01", "ops@mercflow.test"),
    ).rejects.toThrow("Stripe API unavailable")

    expect(updatePlatformTenantBillingStatus).not.toHaveBeenCalled()
  })
})
