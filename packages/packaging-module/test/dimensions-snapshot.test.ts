import { describe, expect, it } from "vitest"

import { buildDimensionsSnapshotFromPackagingType } from "../src/modules/packaging/dimensions-snapshot"
import type { PackagingTypeRecord } from "../src/modules/packaging/types"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"

function makePackagingType(
  overrides: Partial<PackagingTypeRecord> &
    Pick<
      PackagingTypeRecord,
      "id" | "name" | "length_mm" | "width_mm" | "height_mm" | "max_weight_g"
    >
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

describe("buildDimensionsSnapshotFromPackagingType", (): void => {
  it("captures name and dimension fields from live packaging type", (): void => {
    const packagingType = makePackagingType({
      id: "pkg_small",
      name: "Small box",
      length_mm: 200,
      width_mm: 150,
      height_mm: 100,
      max_weight_g: 1000,
    })

    const snapshot = buildDimensionsSnapshotFromPackagingType(packagingType)

    expect(snapshot).toEqual({
      name: "Small box",
      length_mm: 200,
      width_mm: 150,
      height_mm: 100,
      max_weight_g: 1000,
    })
    expect(Object.keys(snapshot).sort()).toEqual([
      "height_mm",
      "length_mm",
      "max_weight_g",
      "name",
      "width_mm",
    ])
  })
})
