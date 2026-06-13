export type DiscountTypeLabel = "Product" | "Order" | "Buy X get Y" | "Free shipping"

export type DiscountMethodLabel = "Code" | "Automatic"

export type DiscountStatus = "draft" | "active" | "inactive" | "expired"

export type AdminDiscountRow = {
  id: string
  store_id: string
  name: string
  code: string | null
  type: DiscountTypeLabel
  method: DiscountMethodLabel
  status: DiscountStatus
  usage_count: number
  usage_limit: number | null
  expires_at: string | null
  created_at: string | null
  updated_at: string | null
}

export type AdminDiscountDetail = AdminDiscountRow & {
  is_automatic: boolean
  promotion_type: "standard" | "buyget"
  raw_status: "draft" | "active" | "inactive"
}

export type AdminDiscountListResponse = {
  data: AdminDiscountRow[]
  count: number
  limit: number
  offset: number
}
