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

export type DiscountTypeApi = "product" | "order" | "buyget" | "free_shipping"

export type AdminDiscountDetail = AdminDiscountRow & {
  is_automatic: boolean
  promotion_type: "standard" | "buyget"
  raw_status: "draft" | "active" | "inactive"
  discount_type: DiscountTypeApi
  value_type: "percentage" | "fixed" | null
  value: number | null
  starts_at: string | null
  currency_code: string
  minimum_order_amount: number | null
  maximum_order_amount: number | null
  shipping_country_codes: string[] | null
  applies_to: "all" | "collections" | "products"
  collection_ids: string[]
  product_ids: string[]
  catalog_targeting_summary: string | null
  conditions_summary: string | null
}

export type AdminDiscountListResponse = {
  data: AdminDiscountRow[]
  count: number
  limit: number
  offset: number
}
