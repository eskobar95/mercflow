import { describe, expect, it, vi } from "vitest"

import FeedConfigService from "../../src/modules/feed/service"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"
const STORE_B = "store_01ABCDEFGHIJKLMNOPQRSTUVWXYZ"

describe("FeedConfigService", (): void => {
  it("get uses withTenant and filters by store_id", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(
        _storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const listMercflowFeedConfigs = vi.fn().mockResolvedValue([
      {
        id: "fc_1",
        store_id: STORE_A,
        storefront_url: "https://shop.example",
        excluded_product_ids: ["prod_1"],
        excluded_category_ids: [],
        default_condition: "new",
      },
    ])

    const svc = Object.create(FeedConfigService.prototype) as FeedConfigService
    Object.assign(svc, { withTenant, listMercflowFeedConfigs })

    const result = await svc.get(STORE_A)

    expect(withTenant).toHaveBeenCalledWith(STORE_A, expect.any(Function))
    expect(listMercflowFeedConfigs).toHaveBeenCalledWith(
      { store_id: STORE_A },
      {},
      expect.any(Object)
    )
    expect(result?.storefront_url).toBe("https://shop.example")
    expect(result?.excluded_product_ids).toEqual(["prod_1"])
  })

  it("get returns null when no row exists for store", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(
        _storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const listMercflowFeedConfigs = vi.fn().mockResolvedValue([])

    const svc = Object.create(FeedConfigService.prototype) as FeedConfigService
    Object.assign(svc, { withTenant, listMercflowFeedConfigs })

    const result = await svc.get(STORE_B)
    expect(result).toBeNull()
    expect(listMercflowFeedConfigs).toHaveBeenCalledWith(
      { store_id: STORE_B },
      {},
      expect.any(Object)
    )
  })

  it("update creates config when none exists", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(
        _storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const listMercflowFeedConfigs = vi.fn().mockResolvedValue([])
    const createMercflowFeedConfigs = vi.fn().mockResolvedValue([
      {
        id: "fc_new",
        store_id: STORE_A,
        storefront_url: "https://a.example",
        excluded_product_ids: [],
        excluded_category_ids: ["cat_1"],
        default_condition: "new",
      },
    ])

    const svc = Object.create(FeedConfigService.prototype) as FeedConfigService
    Object.assign(svc, {
      withTenant,
      listMercflowFeedConfigs,
      createMercflowFeedConfigs,
    })

    const result = await svc.update(STORE_A, {
      storefront_url: "https://a.example",
      excluded_category_ids: ["cat_1"],
    })

    expect(createMercflowFeedConfigs).toHaveBeenCalledWith([
      expect.objectContaining({
        store_id: STORE_A,
        storefront_url: "https://a.example",
        excluded_category_ids: ["cat_1"],
      }),
    ])
    expect(result.store_id).toBe(STORE_A)
    expect(result.excluded_category_ids).toEqual(["cat_1"])
  })

  it("update patches existing row for store", async (): Promise<void> => {
    const existing = {
      id: "fc_ex",
      store_id: STORE_A,
      storefront_url: "https://old.example",
      excluded_product_ids: [],
      excluded_category_ids: [],
      default_condition: "new",
    }

    const withTenant = vi.fn(
      async <T>(
        _storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const listMercflowFeedConfigs = vi.fn().mockResolvedValue([existing])
    const updateMercflowFeedConfigs = vi.fn().mockResolvedValue([
      {
        ...existing,
        storefront_url: "https://new.example",
        excluded_product_ids: ["prod_x"],
      },
    ])

    const svc = Object.create(FeedConfigService.prototype) as FeedConfigService
    Object.assign(svc, {
      withTenant,
      listMercflowFeedConfigs,
      updateMercflowFeedConfigs,
    })

    const result = await svc.update(STORE_A, {
      storefront_url: "https://new.example",
      excluded_product_ids: ["prod_x"],
    })

    expect(updateMercflowFeedConfigs).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "fc_ex",
        store_id: STORE_A,
        storefront_url: "https://new.example",
        excluded_product_ids: ["prod_x"],
      })
    )
    expect(result.storefront_url).toBe("https://new.example")
    expect(result.excluded_product_ids).toEqual(["prod_x"])
  })
})
