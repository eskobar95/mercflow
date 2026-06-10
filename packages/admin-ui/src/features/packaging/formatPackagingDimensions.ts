import type { PackagingTypeDto } from "./packagingTypes"

type PackagingDimensions = Pick<
  PackagingTypeDto,
  "length_mm" | "width_mm" | "height_mm"
>

function formatMmAsCm(valueMm: number): string {
  const cm = valueMm / 10
  return Number.isInteger(cm) ? String(cm) : cm.toFixed(1)
}

export function formatPackagingDimensions(packaging: PackagingDimensions): string {
  return `${formatMmAsCm(packaging.length_mm)}×${formatMmAsCm(packaging.width_mm)}×${formatMmAsCm(packaging.height_mm)} cm`
}
