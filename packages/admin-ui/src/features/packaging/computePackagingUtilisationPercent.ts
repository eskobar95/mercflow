import type { PackagingTypeDto } from "./packagingTypes"

type PackagingVolume = Pick<PackagingTypeDto, "length_mm" | "width_mm" | "height_mm">

export function computePackagingUtilisationPercent(
  totalVolumeMm3: number,
  packaging: PackagingVolume,
): number {
  const packagingVolumeMm3 =
    packaging.length_mm * packaging.width_mm * packaging.height_mm
  if (packagingVolumeMm3 <= 0) {
    return 0
  }
  return Math.round((totalVolumeMm3 / packagingVolumeMm3) * 100)
}
