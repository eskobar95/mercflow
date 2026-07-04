import { describe, expect, it } from "vitest"

import {
  buildTargetRulesFromDiscountBody,
  formatCatalogTargetingLabel,
  parseTargetRules,
} from "../src/lib/discounts/promotion-target-rules"

describe("promotion target rules", (): void => {
  it("builds collection target rule", (): void => {
    const rules = buildTargetRulesFromDiscountBody({
      collection_ids: ["pcol_123", "pcol_456"],
    })

    expect(rules).toEqual([
      {
        attribute: "items.product.collection_id",
        operator: "in",
        values: ["pcol_123", "pcol_456"],
      },
    ])
  })

  it("builds product target rule", (): void => {
    const rules = buildTargetRulesFromDiscountBody({
      product_ids: ["prod_123"],
    })

    expect(rules).toEqual([
      {
        attribute: "items.product.id",
        operator: "in",
        values: ["prod_123"],
      },
    ])
  })

  it("parses product target rules from remote query shape", (): void => {
    const parsed = parseTargetRules([
      {
        attribute: "items.product.collection_id",
        operator: "in",
        values: [{ value: "pcol_123" }],
      },
    ])

    expect(parsed.applies_to).toBe("collections")
    expect(parsed.collection_ids).toEqual(["pcol_123"])
  })

  it("formats catalog targeting label", (): void => {
    expect(
      formatCatalogTargetingLabel({
        applies_to: "all",
        collection_ids: [],
        product_ids: [],
      }),
    ).toBe("All products")

    expect(
      formatCatalogTargetingLabel({
        applies_to: "collections",
        collection_ids: ["pcol_1", "pcol_2"],
        product_ids: [],
      }),
    ).toBe("Specific collections (2 selected)")
  })
})
