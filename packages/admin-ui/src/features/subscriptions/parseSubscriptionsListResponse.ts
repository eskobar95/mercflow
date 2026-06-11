import type { AdminSubscriptionListResponse, AdminSubscriptionRow, SubscriptionInterval } from "./types"
import { SUBSCRIPTION_INTERVALS } from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function pickNullableString(value: unknown): string | null {
  if (typeof value === "string") {
    return value
  }
  if (value === null) {
    return null
  }
  return null
}

function pickInterval(value: unknown): SubscriptionInterval | null {
  if (typeof value !== "string") {
    return null
  }
  return SUBSCRIPTION_INTERVALS.includes(value as SubscriptionInterval)
    ? (value as SubscriptionInterval)
    : null
}

function pickRow(value: unknown): AdminSubscriptionRow | null {
  if (!isRecord(value)) {
    return null
  }

  const id = value.id
  const store_id = value.store_id
  const customer_id = value.customer_id
  const product_id = value.product_id
  const variant_id = value.variant_id
  const status = value.status
  const interval = pickInterval(value.interval)
  const current_period_start = value.current_period_start
  const current_period_end = value.current_period_end

  if (
    typeof id !== "string" ||
    typeof store_id !== "string" ||
    typeof customer_id !== "string" ||
    typeof product_id !== "string" ||
    typeof variant_id !== "string" ||
    typeof status !== "string" ||
    interval === null ||
    typeof current_period_start !== "string" ||
    typeof current_period_end !== "string"
  ) {
    return null
  }

  return {
    id,
    store_id,
    customer_id,
    product_id,
    variant_id,
    interval,
    status,
    stripe_subscription_id: pickNullableString(value.stripe_subscription_id),
    current_period_start,
    current_period_end,
    next_renewal_at: pickNullableString(value.next_renewal_at),
    cancelled_at: pickNullableString(value.cancelled_at),
    pause_requested_at: pickNullableString(value.pause_requested_at),
    customer_display: pickNullableString(value.customer_display),
    product_label: pickNullableString(value.product_label),
  }
}

export function parseSubscriptionsListEnvelope(
  value: unknown
): AdminSubscriptionListResponse | null {
  if (!isRecord(value)) {
    return null
  }
  if (!Array.isArray(value.data)) {
    return null
  }

  const data: AdminSubscriptionRow[] = []
  for (const item of value.data) {
    const row = pickRow(item)
    if (row === null) {
      return null
    }
    data.push(row)
  }

  if (
    typeof value.count !== "number" ||
    typeof value.limit !== "number" ||
    typeof value.offset !== "number"
  ) {
    return null
  }

  return {
    data,
    count: value.count,
    limit: value.limit,
    offset: value.offset,
  }
}

export function parseSubscriptionRow(value: unknown): AdminSubscriptionRow | null {
  if (!isRecord(value)) {
    return null
  }
  if (!isRecord(value.data)) {
    return pickRow(value)
  }
  return pickRow(value.data)
}
