import { afterEach, describe, expect, it, vi } from "vitest"

import { clearTenantResolverCacheForTests } from "../src/modules/seo/tenant-resolver-cache"
import { resolveStoreIdFromHost } from "../src/modules/seo/tenant-resolver"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"
const STORE_B = "store_01ABCDEFGHIJKLMNOPQRSTUVWXYZ"

describe("resolveStoreIdFromHost (seo-module)", (): void => {
  const originalHostMap = process.env.MERCFLOW_HOST_MAP
  const originalStoreIds = process.env.MERCFLOW_TENANT_STORE_IDS

  afterEach((): void => {
    clearTenantResolverCacheForTests()
    if (originalHostMap === undefined) {
      delete process.env.MERCFLOW_HOST_MAP
    } else {
      process.env.MERCFLOW_HOST_MAP = originalHostMap
    }
    if (originalStoreIds === undefined) {
      delete process.env.MERCFLOW_TENANT_STORE_IDS
    } else {
      process.env.MERCFLOW_TENANT_STORE_IDS = originalStoreIds
    }
  })

  it("resolves from MERCFLOW_HOST_MAP", async (): Promise<void> => {
    process.env.MERCFLOW_HOST_MAP = JSON.stringify({ "shop-a.example": STORE_A })
    const getStorefrontUrl = vi.fn()
    const storeId = await resolveStoreIdFromHost({
      hostHeader: "shop-a.example",
      storeIdHeader: undefined,
      lookup: { getStorefrontUrl },
    })
    expect(storeId).toBe(STORE_A)
    expect(getStorefrontUrl).not.toHaveBeenCalled()
  })

  it("resolves from mercflow_seo_config storefront_url scan", async (): Promise<void> => {
    delete process.env.MERCFLOW_HOST_MAP
    process.env.MERCFLOW_TENANT_STORE_IDS = `${STORE_A},${STORE_B}`
    const getStorefrontUrl = vi
      .fn()
      .mockResolvedValueOnce("https://shop-a.example")
      .mockResolvedValueOnce("https://shop-b.example")

    const storeId = await resolveStoreIdFromHost({
      hostHeader: "shop-b.example",
      storeIdHeader: undefined,
      lookup: { getStorefrontUrl },
    })

    expect(storeId).toBe(STORE_B)
  })

  it("returns null for unknown host (fail closed)", async (): Promise<void> => {
    delete process.env.MERCFLOW_HOST_MAP
    delete process.env.MERCFLOW_TENANT_STORE_IDS
    const storeId = await resolveStoreIdFromHost({
      hostHeader: "unknown.example",
      storeIdHeader: undefined,
      lookup: { getStorefrontUrl: vi.fn().mockResolvedValue(null) },
    })
    expect(storeId).toBeNull()
  })

  it("does not cache failed host lookups", async (): Promise<void> => {
    delete process.env.MERCFLOW_HOST_MAP
    process.env.MERCFLOW_TENANT_STORE_IDS = STORE_A
    const getStorefrontUrl = vi.fn().mockResolvedValue("https://other.example")
    await resolveStoreIdFromHost({
      hostHeader: "miss.example",
      storeIdHeader: undefined,
      lookup: { getStorefrontUrl },
    })
    await resolveStoreIdFromHost({
      hostHeader: "miss.example",
      storeIdHeader: undefined,
      lookup: { getStorefrontUrl },
    })
    expect(getStorefrontUrl).toHaveBeenCalledTimes(2)
  })

  it("caches successful resolution for 60s", async (): Promise<void> => {
    process.env.MERCFLOW_HOST_MAP = JSON.stringify({ "cached.example": STORE_A })
    const getStorefrontUrl = vi.fn()
    await resolveStoreIdFromHost({
      hostHeader: "cached.example",
      storeIdHeader: undefined,
      lookup: { getStorefrontUrl },
    })
    await resolveStoreIdFromHost({
      hostHeader: "cached.example",
      storeIdHeader: undefined,
      lookup: { getStorefrontUrl },
    })
    expect(getStorefrontUrl).not.toHaveBeenCalled()
  })

  it("accepts X-Store-Id only in development/test", async (): Promise<void> => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "development"
    const storeId = await resolveStoreIdFromHost({
      hostHeader: undefined,
      storeIdHeader: STORE_A,
      lookup: { getStorefrontUrl: vi.fn() },
    })
    expect(storeId).toBe(STORE_A)
    process.env.NODE_ENV = originalEnv
  })
})
