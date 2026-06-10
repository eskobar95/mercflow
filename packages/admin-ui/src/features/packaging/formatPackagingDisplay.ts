import { medusaMmToDisplayCm } from "@/lib/products/productVariantShippingUnits"

export function formatPackagingDimensions(row: {
  length_mm: number
  width_mm: number
  height_mm: number
}): string {
  const lengthCm = medusaMmToDisplayCm(row.length_mm)
  const widthCm = medusaMmToDisplayCm(row.width_mm)
  const heightCm = medusaMmToDisplayCm(row.height_mm)
  return `${lengthCm}×${widthCm}×${heightCm} cm`
}

export function formatPackagingWeightG(grams: number): string {
  if (!Number.isFinite(grams) || grams < 0) {
    return "—"
  }
  if (grams >= 1000) {
    const kg = grams / 1000
    const formatted = kg.toFixed(1).replace(/\.0$/u, "")
    return `${formatted} kg`
  }
  return `${Math.round(grams)} g`
}
