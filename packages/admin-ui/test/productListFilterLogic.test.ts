import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  rowMatchesProductFilter,
  startOfPeriod,
} from "@/components/product-list/productListFilterLogic"
import type { ProductListRow } from "@/data/mockProducts"

const sampleRow: ProductListRow = {
  id: "prod_1",
  title: "Aurora running shoes",
  status: "published",
  collection: "Footwear",
  sku: "FOOT-AUR-42",
  updatedAt: "2026-01-20T10:00:00.000Z",
  thumbnailHue: 210,
}

describe("startOfPeriod", (): void => {
  beforeEach((): void => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-24T14:00:00.000Z"))
  })

  afterEach((): void => {
    vi.useRealTimers()
  })

  it("returns midnight local time for today", (): void => {
    const start = startOfPeriod("today")
    const d = new Date(start)
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
    expect(d.getDate()).toBe(24)
    expect(d.getMonth()).toBe(4)
  })

  it("returns start of week (Sunday) for week", (): void => {
    const start = startOfPeriod("week")
    const d = new Date(start)
    expect(d.getDay()).toBe(0)
  })

  it("returns first day of month for month", (): void => {
    const start = startOfPeriod("month")
    const d = new Date(start)
    expect(d.getDate()).toBe(1)
    expect(d.getMonth()).toBe(4)
  })
})

describe("rowMatchesProductFilter", (): void => {
  it("passes when filter has no values", (): void => {
    expect(
      rowMatchesProductFilter(sampleRow, {
        categoryId: "status",
        operator: "is",
        valueIds: [],
      }),
    ).toBe(true)
  })

  it("matches status with is operator", (): void => {
    expect(
      rowMatchesProductFilter(sampleRow, {
        categoryId: "status",
        operator: "is",
        valueIds: ["published"],
      }),
    ).toBe(true)

    expect(
      rowMatchesProductFilter(sampleRow, {
        categoryId: "status",
        operator: "is",
        valueIds: ["draft"],
      }),
    ).toBe(false)
  })

  it("inverts status match with is not operator", (): void => {
    expect(
      rowMatchesProductFilter(sampleRow, {
        categoryId: "status",
        operator: "is not",
        valueIds: ["draft"],
      }),
    ).toBe(true)

    expect(
      rowMatchesProductFilter(sampleRow, {
        categoryId: "status",
        operator: "is not",
        valueIds: ["published"],
      }),
    ).toBe(false)
  })

  it("matches collection values", (): void => {
    expect(
      rowMatchesProductFilter(sampleRow, {
        categoryId: "collection",
        operator: "is",
        valueIds: ["Footwear", "Bags"],
      }),
    ).toBe(true)
  })

  it("matches updated after a period", (): void => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-24T14:00:00.000Z"))

    expect(
      rowMatchesProductFilter(
        { ...sampleRow, updatedAt: "2026-05-24T08:00:00.000Z" },
        { categoryId: "updated", operator: "after", valueIds: ["today"] },
      ),
    ).toBe(true)

    expect(
      rowMatchesProductFilter(
        { ...sampleRow, updatedAt: "2025-01-01T08:00:00.000Z" },
        { categoryId: "updated", operator: "after", valueIds: ["today"] },
      ),
    ).toBe(false)

    vi.useRealTimers()
  })

  it("ignores invalid operators on updated category", (): void => {
    expect(
      rowMatchesProductFilter(sampleRow, {
        categoryId: "updated",
        operator: "is",
        valueIds: ["today"],
      }),
    ).toBe(true)
  })
})
