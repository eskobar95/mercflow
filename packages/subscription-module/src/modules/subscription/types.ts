export const SUBSCRIPTION_INTERVALS = [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
] as const

export type SubscriptionInterval = (typeof SUBSCRIPTION_INTERVALS)[number]

export const SUBSCRIPTION_STATUSES = [
  "active",
  "paused",
  "cancelled",
  "past_due",
  "pending_payment",
] as const

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export const RENEWAL_LOG_STATUSES = ["success", "failed", "skipped"] as const

export type RenewalLogStatus = (typeof RENEWAL_LOG_STATUSES)[number]

export type SubscriptionRecord = {
  id: string
  store_id: string
  customer_id: string
  product_id: string
  variant_id: string
  interval: SubscriptionInterval
  status: SubscriptionStatus
  stripe_subscription_id: string | null
  current_period_start: string | Date
  current_period_end: string | Date
  next_renewal_at: string | Date
  cancelled_at: string | Date | null
  pause_requested_at: string | Date | null
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}

export type SubscriptionRenewalLogRecord = {
  id: string
  subscription_id: string
  order_id: string
  amount: string | number
  currency: string
  status: RenewalLogStatus
  stripe_payment_intent_id: string | null
  error_message: string | null
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}

export type SubscriptionConfigRecord = {
  id: string
  store_id: string
  club_enabled: boolean
  club_stripe_product_id: string | null
  club_price_monthly: string | number | null
  club_price_annual: string | number | null
  club_fallback_discount_pct: string | number | null
  club_name: string | null
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}

export type CreateSubscriptionInput = {
  customer_id: string
  product_id: string
  variant_id: string
  interval: SubscriptionInterval
  status?: SubscriptionStatus
  stripe_subscription_id?: string | null
  current_period_start: Date
  current_period_end: Date
  next_renewal_at: Date
}

export type SubscriptionDetail = {
  subscription: SubscriptionRecord
  renewal_logs: SubscriptionRenewalLogRecord[]
}

export type AdminSubscriptionListItem = {
  id: string
  store_id: string
  customer_id: string
  product_id: string
  variant_id: string
  interval: SubscriptionInterval
  status: SubscriptionStatus
  stripe_subscription_id: string | null
  current_period_start: string
  current_period_end: string
  next_renewal_at: string
  cancelled_at: string | null
  pause_requested_at: string | null
  customer_display: string | null
  product_label: string | null
}

export type AdminSubscriptionDetail = AdminSubscriptionListItem & {
  renewal_logs: Array<{
    id: string
    order_id: string
    amount: string
    currency: string
    status: RenewalLogStatus
    stripe_payment_intent_id: string | null
    error_message: string | null
    created_at: string
  }>
}

export type PauseSubscriptionInput = {
  pause_until?: string | null
}

export type UpdateRenewalTimestampInput = {
  next_renewal_at: Date
  current_period_start?: Date
  current_period_end?: Date
}

export type CompleteRenewalSuccessInput = {
  order_id: string
  amount: number
  currency: string
  stripe_payment_intent_id: string
  renewed_at: Date
}

export type RecordRenewalFailureInput = {
  order_id: string
  amount: number
  currency: string
  stripe_payment_intent_id?: string | null
  error_message: string
}

export type UpsertSubscriptionConfigInput = {
  club_enabled: boolean
  club_name?: string | null
  club_price_monthly?: number | null
  club_price_annual?: number | null
  club_fallback_discount_pct?: number | null
}

export type SubscriptionConfigAdminDto = {
  id: string
  store_id: string
  club_enabled: boolean
  club_stripe_product_id: string | null
  club_name: string | null
  club_price_monthly: string | null
  club_price_annual: string | null
  club_fallback_discount_pct: string | null
  created_at: string
  updated_at: string
}
