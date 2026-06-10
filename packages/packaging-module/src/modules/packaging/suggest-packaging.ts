import { MedusaError } from "@medusajs/utils"

import type {
  PackagingTypeRecord,
  SuggestPackagingItem,
  VariantDimensions,
} from "./types"

const VOLUME_BUFFER_FACTOR = 1.2

export function packagingVolumeMm3(row: {
  length_mm: number
  width_mm: number
  height_mm: number
}): number {
  return row.length_mm * row.width_mm * row.height_mm
}

function isPositiveInteger(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && value > 0
}

function assertVariantDimensions(
  variantId: string,
  dimensions: VariantDimensions | undefined
): VariantDimensions {
  if (!dimensions) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product variant "${variantId}" not found`
    )
  }

  const { length_mm, width_mm, height_mm, weight_g } = dimensions
  if (
    !isPositiveInteger(length_mm) ||
    !isPositiveInteger(width_mm) ||
    !isPositiveInteger(height_mm) ||
    !isPositiveInteger(weight_g)
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Product variant "${variantId}" is missing shipping dimensions or weight`
    )
  }

  return dimensions
}

export function computePackagingTotals(
  items: SuggestPackagingItem[],
  variants: Map<string, VariantDimensions>
): { totalVolumeMm3: number; totalWeightG: number } {
  let rawVolumeMm3 = 0
  let totalWeightG = 0

  for (const item of items) {
    if (!isPositiveInteger(item.quantity)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "quantity must be a positive integer"
      )
    }

    const dimensions = assertVariantDimensions(item.variantId, variants.get(item.variantId))
    rawVolumeMm3 +=
      dimensions.length_mm *
      dimensions.width_mm *
      dimensions.height_mm *
      item.quantity
    totalWeightG += dimensions.weight_g * item.quantity
  }

  return {
    totalVolumeMm3: Math.ceil(rawVolumeMm3 * VOLUME_BUFFER_FACTOR),
    totalWeightG,
  }
}

export function pickSmallestQualifyingPackaging(
  catalog: PackagingTypeRecord[],
  totalVolumeMm3: number,
  totalWeightG: number
): PackagingTypeRecord | null {
  const candidates = catalog
    .filter((row) => row.is_active && row.deleted_at === null)
    .filter(
      (row) =>
        packagingVolumeMm3(row) >= totalVolumeMm3 && row.max_weight_g >= totalWeightG
    )
    .sort((a, b) => packagingVolumeMm3(a) - packagingVolumeMm3(b))

  return candidates[0] ?? null
}

export function suggestPackagingFromCatalog(
  catalog: PackagingTypeRecord[],
  items: SuggestPackagingItem[],
  variants: Map<string, VariantDimensions>
): {
  suggested: PackagingTypeRecord | null
  total_volume_mm3: number
  total_weight_g: number
} {
  const { totalVolumeMm3, totalWeightG } = computePackagingTotals(items, variants)
  const suggested = pickSmallestQualifyingPackaging(
    catalog,
    totalVolumeMm3,
    totalWeightG
  )

  return {
    suggested,
    total_volume_mm3: totalVolumeMm3,
    total_weight_g: totalWeightG,
  }
}
