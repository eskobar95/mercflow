import { afterEach, describe, expect, it, vi } from "vitest"

import type FeedConfigService from "../src/modules/feed/service"
import { resolveStoreIdFromHost } from "../src/modules/feed/tenant-resolver"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"
const STORE_B = "store_01ABCDEFGHIJKLMNOPQRSTUVWXYZ"

describe("resolveStoreIdFromHost", (): void => {
  const originalHostMap = process.env.MERCFLOW_FEED_HOST_MAP
  const originalStoreIds = process.env.MERCFLOW_TENANT_STORE_IDS

  afterEach((): void => {
    if (originalHostMap === undefined) {
      delete process.env.MERCFLOW_FEED_HOST_MAP
    } else {
      process.env.MERCFLOW_FEED_HOST_MAP = originalHostMap
    }
    if (originalStoreIds === undefined) {
      delete process.env.MERCFLOW_TENANT_STORE_IDS
    } else {
      process.env.MERCFLOW_TENANT_STORE_IDS = originalStoreIds
    }
  })

  it("resolves from MERCFLOW_FEED_HOST_MAP", async (): Promise<void> => {
    process.env.MERCFLOW_FEED_HOST_MAP = JSON.stringify({ "shop-a.example": STORE_A })
    const get = vi.fn()
    const storeId = await resolveStoreIdFromHost({
      hostHeader: "shop-a.example",
      storeIdHeader: undefined,
      feedConfigService: { get } as unknown as FeedConfigService,
    })
    expect(storeId).toBe(STORE_A)
    expect(get).not.toHaveBeenCalled()
  })

  it("resolves from storefront_url scan across candidate stores", async (): Promise<void> => {
    delete process.env.MERCFLOW_FEED_HOST_MAP
    process.env.MERCFLOW_TENANT_STORE_IDS = `${STORE_A},${STORE_B}`
    const get = vi
      .fn()
      .mockResolvedValueOnce({ storefront_url: "https://shop-a.example" })
      .mockResolvedValueOnce({ storefront_url: "https://shop-b.example" })

    const storeId = await resolveStoreIdFromHost({
      hostHeader: "shop-b.example",
      storeIdHeader: undefined,
      feedConfigService: { get } as unknown as FeedConfigService,
    })

    expect(storeId).toBe(STORE_B)
  })

  it("returns null for unknown host (fail closed)", async (): Promise<void> => {
    delete process.env.MERCFLOW_FEED_HOST_MAP
    delete process.env.MERCFLOW_TENANT_STORE_IDS
    const storeId = await resolveStoreIdFromHost({
      hostHeader: "unknown.example",
      storeIdHeader: undefined,
      feedConfigService: { get: vi.fn().mockResolvedValue(null) } as unknown as FeedConfigService,
    })
    expect(storeId).toBeNull()
  })

  it("accepts X-Store-Id only in development/test", async (): Promise<void> => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "development"
    const storeId = await resolveStoreIdFromHost({
      hostHeader: undefined,
      storeIdHeader: STORE_A,
      feedConfigService: { get: vi.fn() } as unknown as FeedConfigService,
    })
    expect(storeId).toBe(STORE_A)
    process.env.NODE_ENV = originalEnv
  })

  it("ignores X-Store-Id in production", async (): Promise<void> => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "production"
    delete process.env.MERCFLOW_FEED_ALLOW_X_STORE_ID
    const storeId = await resolveStoreIdFromHost({
      hostHeader: undefined,
      storeIdHeader: STORE_A,
      feedConfigService: { get: vi.fn().mockResolvedValue(null) } as unknown as FeedConfigService,
    })
    expect(storeId).toBeNull()
    process.env.NODE_ENV = originalEnv
  })
})
