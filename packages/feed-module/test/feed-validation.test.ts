import { describe, expect, it } from "vitest"

import { countFeedItems, validateFeedCatalog } from "../src/modules/feed/feed-validation"
import type { FeedCatalogProduct, FeedConfigRecord } from "../src/modules/feed/types"

const baseConfig: FeedConfigRecord = {
  id: "fcfg_1",
  store_id: "store_1",
  storefront_url: "https://shop.example.com",
  excluded_product_ids: ["prod_excluded"],
  excluded_category_ids: ["cat_excluded"],
  default_condition: "new",
}

function product(overrides: Partial<FeedCatalogProduct> = {}): FeedCatalogProduct {
  return {
    id: "prod_1",
    title: "Sample",
    handle: "sample",
    description: "Desc",
    status: "published",
    thumbnail: "https://cdn.example.com/thumb.jpg",
    category_ids: [],
    variants: [
      {
        id: "var_1",
        sku: "SKU-1",
        manage_inventory: true,
        inventory_quantity: 5,
        prices: [{ amount: 1000, currency_code: "dkk" }],
      },
    ],
    ...overrides,
  }
}

describe("validateFeedCatalog", (): void => {
  it("skips excluded products and categories", (): void => {
    const excludedByProduct = product({ id: "prod_excluded" })
    const excludedByCategory = product({
      id: "prod_cat",
      category_ids: ["cat_excluded"],
    })
    const valid = product({ id: "prod_ok" })

    const issues = validateFeedCatalog({
      config: baseConfig,
      products: [excludedByProduct, excludedByCategory, valid],
      contentByProductId: new Map(),
    })

    expect(issues.every((row) => row.product_id === "prod_ok")).toBe(true)
  })

  it("reports missing required fields", (): void => {
    const issues = validateFeedCatalog({
      config: baseConfig,
      products: [
        product({
          handle: "",
          thumbnail: null,
          variants: [{ id: "v1", sku: "", manage_inventory: null, inventory_quantity: null, prices: [] }],
        }),
      ],
      contentByProductId: new Map([
        ["prod_1", { seo_description: null, image_url: null }],
      ]),
    })

    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0]?.missing_fields).toEqual(
      expect.arrayContaining(["handle", "image_link", "sku", "price"])
    )
  })
})

describe("countFeedItems", (): void => {
  it("does not count excluded products", (): void => {
    const counts = countFeedItems(baseConfig, [
      product({ id: "prod_excluded" }),
      product({ id: "prod_ok" }),
    ])
    expect(counts).toEqual({ product_count: 1, variant_count: 1 })
  })
})
