export const PACKAGING_TYPE_KINDS = ["box", "envelope", "bag", "tube", "other"] as const

export type PackagingTypeKind = (typeof PACKAGING_TYPE_KINDS)[number]

export type PackagingTypeRecord = {
  id: string
  store_id: string
  name: string
  type: PackagingTypeKind
  length_mm: number
  width_mm: number
  height_mm: number
  max_weight_g: number
  is_active: boolean
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}

export type CreatePackagingTypeInput = {
  name: string
  type: PackagingTypeKind
  length_mm: number
  width_mm: number
  height_mm: number
  max_weight_g: number
  is_active?: boolean
}

export type UpdatePackagingTypeInput = {
  name?: string
  type?: PackagingTypeKind
  length_mm?: number
  width_mm?: number
  height_mm?: number
  max_weight_g?: number
  is_active?: boolean
}

export type SuggestPackagingItem = {
  variantId: string
  quantity: number
}

export type VariantDimensions = {
  length_mm: number
  width_mm: number
  height_mm: number
  weight_g: number
}

export type VariantDimensionLoader = (
  variantIds: string[]
) => Promise<Map<string, VariantDimensions>>

export type SuggestPackagingResult = {
  suggested: PackagingTypeRecord | null
  total_volume_mm3: number
  total_weight_g: number
}
