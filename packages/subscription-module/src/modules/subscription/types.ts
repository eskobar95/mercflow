export type AdminSubscriptionListItem = {
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
