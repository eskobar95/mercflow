/** Admin subscription payload returned by MercFlow `/admin/subscriptions*` routes. */

export const SUBSCRIPTION_INTERVALS = [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
] as const

export type SubscriptionInterval = (typeof SUBSCRIPTION_INTERVALS)[number]

export type AdminSubscriptionRow = {
  id: string
  store_id: string
  customer_id: string
  product_id: string
  variant_id: string
  interval: SubscriptionInterval
  status: string
  stripe_subscription_id: string | null
  current_period_start: string
  current_period_end: string
  next_renewal_at: string | null
  cancelled_at: string | null
  pause_requested_at: string | null
  customer_display: string | null
  product_label: string | null
}

export type AdminSubscriptionListResponse = {
  data: AdminSubscriptionRow[]
  count: number
  limit: number
  offset: number
}

export type AdminRenewalLogRow = {
  id: string
  order_id: string
  amount: string
  currency: string
  status: string
  stripe_payment_intent_id: string | null
  error_message: string | null
  created_at: string
}

export type AdminSubscriptionDetail = AdminSubscriptionRow & {
  renewal_logs: AdminRenewalLogRow[]
}

export type CanonicalSubscriptionUiStatus =
  | "active"
  | "paused"
  | "past_due"
  | "cancelled"
  | "pending_payment"
  | "unknown"
