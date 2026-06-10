import type { DimensionsSnapshot, PackagingTypeRecord } from "./types"

export function buildDimensionsSnapshotFromPackagingType(
  packagingType: Pick<
    PackagingTypeRecord,
    "name" | "length_mm" | "width_mm" | "height_mm" | "max_weight_g"
  >
): DimensionsSnapshot {
  return {
    name: packagingType.name,
    length_mm: packagingType.length_mm,
    width_mm: packagingType.width_mm,
    height_mm: packagingType.height_mm,
    max_weight_g: packagingType.max_weight_g,
  }
}
