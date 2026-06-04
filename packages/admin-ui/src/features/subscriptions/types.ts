/** Admin subscription payload returned by MercFlow `/admin/subscriptions*` routes. */

export type AdminSubscriptionRow = {
  id: string
  customer_id: string
  status: string
  cycle_weeks: number
  next_renewal_at: string | null
  variant_id: string
  discount_percent: number | null
  customer_display: string | null
  product_label: string | null
}

export type AdminSubscriptionListResponse = {
  data: AdminSubscriptionRow[]
  count: number
  limit: number
  offset: number
}

export type AdminSubscriptionDetailResponse = {
  data: AdminSubscriptionRow
}

export type CanonicalSubscriptionUiStatus =
  | "active"
  | "paused"
  | "on_hold"
  | "cancelled"
  | "expired"
  | "unknown"
