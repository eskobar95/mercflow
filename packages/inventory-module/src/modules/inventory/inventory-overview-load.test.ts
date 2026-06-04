import { describe, expect, it } from "vitest"

import {
  buildOverviewRowsFromVariants,
  filterAndPaginateOverviewRows,
} from "./inventory-overview-load"

describe("inventory-overview-load", (): void => {
  it("buildOverviewRowsFromVariants computes available and incoming", (): void => {
    const rows = buildOverviewRowsFromVariants({
      variantRows: [
        {
          id: "variant_1",
          sku: "SKU-1",
          title: "Red",
          inventory_quantity: 10,
          product: { title: "Shirt" },
        },
      ],
      incomingByVariant: new Map([["variant_1", 4]]),
      lowStockThreshold: 5,
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]?.available).toBe(10)
    expect(rows[0]?.incoming).toBe(4)
    expect(rows[0]?.is_low_stock).toBe(false)
  })

  it("filterAndPaginateOverviewRows filters low stock and paginates", (): void => {
    const rows = [
      {
        variant_id: "a",
        sku: null,
        title: "A",
        stocked: 1,
        reserved: 0,
        available: 1,
        incoming: 0,
        is_low_stock: true,
      },
      {
        variant_id: "b",
        sku: null,
        title: "B",
        stocked: 20,
        reserved: 0,
        available: 20,
        incoming: 0,
        is_low_stock: false,
      },
    ]

    const result = filterAndPaginateOverviewRows(rows, {
      search: "",
      filter: "low_stock",
      page: 1,
      limit: 10,
    })

    expect(result.count).toBe(1)
    expect(result.rows[0]?.variant_id).toBe("a")
  })
})
