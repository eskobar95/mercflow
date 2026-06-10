import { describe, expect, it } from "vitest"

import {
  computePackagingTotals,
  pickSmallestQualifyingPackaging,
  suggestPackagingFromCatalog,
} from "../src/modules/packaging/suggest-packaging"
import type { PackagingTypeRecord, VariantDimensions } from "../src/modules/packaging/types"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"

function makePackagingType(
  overrides: Partial<PackagingTypeRecord> & Pick<PackagingTypeRecord, "id" | "name" | "length_mm" | "width_mm" | "height_mm" | "max_weight_g">
): PackagingTypeRecord {
  return {
    store_id: STORE_A,
    type: "box",
    is_active: true,
    created_at: new Date("2026-06-10T12:00:00.000Z"),
    updated_at: new Date("2026-06-10T12:00:00.000Z"),
    deleted_at: null,
    ...overrides,
  }
}

describe("suggestPackaging algorithm", (): void => {
  const variants = new Map<string, VariantDimensions>([
    [
      "variant_small",
      { length_mm: 100, width_mm: 80, height_mm: 40, weight_g: 250 },
    ],
    [
      "variant_large",
      { length_mm: 200, width_mm: 150, height_mm: 100, weight_g: 900 },
    ],
  ])

  const catalog: PackagingTypeRecord[] = [
    makePackagingType({
      id: "pkg_small",
      name: "Small box",
      length_mm: 200,
      width_mm: 150,
      height_mm: 100,
      max_weight_g: 1000,
    }),
    makePackagingType({
      id: "pkg_medium",
      name: "Medium box",
      length_mm: 300,
      width_mm: 200,
      height_mm: 150,
      max_weight_g: 3000,
    }),
    makePackagingType({
      id: "pkg_large",
      name: "Large box",
      length_mm: 400,
      width_mm: 300,
      height_mm: 200,
      max_weight_g: 5000,
    }),
    makePackagingType({
      id: "pkg_inactive",
      name: "Inactive box",
      length_mm: 500,
      width_mm: 500,
      height_mm: 500,
      max_weight_g: 10000,
      is_active: false,
    }),
  ]

  it("computes buffered volume and total weight from variant dimensions", (): void => {
    const totals = computePackagingTotals(
      [{ variantId: "variant_small", quantity: 2 }],
      variants
    )

    expect(totals.totalVolumeMm3).toBe(Math.ceil(100 * 80 * 40 * 2 * 1.2))
    expect(totals.totalWeightG).toBe(500)
  })

  it("returns the smallest qualifying active packaging type", (): void => {
    const result = suggestPackagingFromCatalog(
      catalog,
      [{ variantId: "variant_small", quantity: 1 }],
      variants
    )

    expect(result.suggested?.id).toBe("pkg_small")
    expect(result.total_volume_mm3).toBe(Math.ceil(100 * 80 * 40 * 1.2))
    expect(result.total_weight_g).toBe(250)
  })

  it("skips packaging that is too small in volume or weight", (): void => {
    const totals = computePackagingTotals(
      [{ variantId: "variant_large", quantity: 3 }],
      variants
    )
    const suggested = pickSmallestQualifyingPackaging(catalog, totals.totalVolumeMm3, totals.totalWeightG)

    expect(suggested?.id).toBe("pkg_large")
  })

  it("returns null when no catalog entry qualifies", (): void => {
    const result = suggestPackagingFromCatalog(
      catalog,
      [{ variantId: "variant_large", quantity: 10 }],
      variants
    )

    expect(result.suggested).toBeNull()
    expect(result.total_weight_g).toBe(9000)
  })
})
