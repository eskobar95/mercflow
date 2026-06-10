export type PackagingTypeKind = "box" | "envelope" | "bag" | "tube" | "other"

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

export type SuggestPackagingResult = {
  suggested: PackagingTypeDto | null
  total_volume_mm3: number
  total_weight_g: number
}

export type SuggestPackagingItemInput = {
  variant_id: string
  quantity: number
}

export type DimensionsSnapshotDto = {
  name: string
  length_mm: number
  width_mm: number
  height_mm: number
  max_weight_g: number
}

export type ShipmentPackagingDto = {
  id: string
  store_id: string
  fulfillment_id: string
  packaging_type_id: string
  dimensions_snapshot_json: DimensionsSnapshotDto
  created_at: string
  updated_at: string
  deleted_at: string | null
}
