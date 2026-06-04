import { describe, expect, it } from "vitest"

import {
  buildOverviewRowsFromVariants,
  filterAndPaginateOverviewRows,
  sortOverviewRows,
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
      sort_by: "available",
      sort_dir: "asc",
      page: 1,
      limit: 10,
    })

    expect(result.count).toBe(1)
    expect(result.rows[0]?.variant_id).toBe("a")
  })

  it("sortOverviewRows orders full filtered set before pagination", (): void => {
    const rows = [
      {
        variant_id: "low",
        sku: null,
        title: "Low",
        stocked: 1,
        reserved: 0,
        available: 1,
        incoming: 0,
        is_low_stock: true,
      },
      {
        variant_id: "high",
        sku: null,
        title: "High",
        stocked: 50,
        reserved: 0,
        available: 50,
        incoming: 0,
        is_low_stock: false,
      },
    ]

    const paged = filterAndPaginateOverviewRows(rows, {
      search: "",
      filter: "all",
      sort_by: "available",
      sort_dir: "desc",
      page: 1,
      limit: 1,
    })

    expect(paged.rows[0]?.variant_id).toBe("high")
    expect(sortOverviewRows(rows, "available", "desc")[0]?.variant_id).toBe("high")
  })
})
