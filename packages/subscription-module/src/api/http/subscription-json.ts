import type {
  AdminSubscriptionDetail,
  AdminSubscriptionListItem,
  SubscriptionRecord,
  SubscriptionRenewalLogRecord,
} from "../../modules/subscription/types"
import { toIso } from "../../modules/subscription/iso"

function amountToString(value: string | number): string {
  if (typeof value === "number") {
    return value.toFixed(2)
  }
  return value
}

export function subscriptionToAdminListJson(
  row: SubscriptionRecord,
  labels?: { customer_display?: string | null; product_label?: string | null }
): AdminSubscriptionListItem {
  return {
    id: row.id,
    store_id: row.store_id,
    customer_id: row.customer_id,
    product_id: row.product_id,
    variant_id: row.variant_id,
    interval: row.interval,
    status: row.status,
    stripe_subscription_id: row.stripe_subscription_id,
    current_period_start: toIso(row.current_period_start),
    current_period_end: toIso(row.current_period_end),
    next_renewal_at: toIso(row.next_renewal_at),
    cancelled_at: row.cancelled_at != null ? toIso(row.cancelled_at) : null,
    pause_requested_at:
      row.pause_requested_at != null ? toIso(row.pause_requested_at) : null,
    customer_display: labels?.customer_display ?? null,
    product_label: labels?.product_label ?? null,
  }
}

export function renewalLogToAdminJson(row: SubscriptionRenewalLogRecord): {
  id: string
  order_id: string
  amount: string
  currency: string
  status: SubscriptionRenewalLogRecord["status"]
  stripe_payment_intent_id: string | null
  error_message: string | null
  created_at: string
} {
  return {
    id: row.id,
    order_id: row.order_id,
    amount: amountToString(row.amount),
    currency: row.currency,
    status: row.status,
    stripe_payment_intent_id: row.stripe_payment_intent_id,
    error_message: row.error_message,
    created_at: toIso(row.created_at),
  }
}

export function subscriptionDetailToAdminJson(
  subscription: SubscriptionRecord,
  renewalLogs: SubscriptionRenewalLogRecord[],
  labels?: { customer_display?: string | null; product_label?: string | null }
): AdminSubscriptionDetail {
  return {
    ...subscriptionToAdminListJson(subscription, labels),
    renewal_logs: renewalLogs.map((row) => renewalLogToAdminJson(row)),
  }
}
