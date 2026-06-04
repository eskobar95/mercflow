import { afterEach, describe, expect, it, vi } from "vitest"

import { resolveStoreIdFromHost } from "../src/modules/feed/tenant-resolver"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"

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

  it("delegates to seo-module lookup when provided", async (): Promise<void> => {
    process.env.MERCFLOW_HOST_MAP = JSON.stringify({ "shop-a.example": STORE_A })
    const getStorefrontUrl = vi.fn()
    const storeId = await resolveStoreIdFromHost({
      hostHeader: "shop-a.example",
      storeIdHeader: undefined,
      feedConfigService: {} as never,
      lookup: { getStorefrontUrl },
    })
    expect(storeId).toBe(STORE_A)
  })

  it("returns null without lookup (production middleware path)", async (): Promise<void> => {
    const storeId = await resolveStoreIdFromHost({
      hostHeader: "shop-a.example",
      storeIdHeader: undefined,
      feedConfigService: {} as never,
    })
    expect(storeId).toBeNull()
  })
})
