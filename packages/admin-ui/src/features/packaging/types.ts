export const PACKAGING_TYPE_KINDS = ["box", "envelope", "bag", "tube", "other"] as const

export type PackagingTypeKind = (typeof PACKAGING_TYPE_KINDS)[number]

export type PackagingTypeDto = {
  id: string
  store_id: string
  name: string
  type: PackagingTypeKind
  length_mm: number
  width_mm: number
  height_mm: number
  max_weight_g: number
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
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
