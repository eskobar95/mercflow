import type { AdminSubscriptionListResponse, AdminSubscriptionRow } from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function pickRow(value: unknown): AdminSubscriptionRow | null {
  if (!isRecord(value)) {
    return null
  }
  const id = value.id
  const customer_id = value.customer_id
  const status = value.status
  const cycle_weeks = value.cycle_weeks
  const variant_id = value.variant_id
  if (
    typeof id !== "string" ||
    typeof customer_id !== "string" ||
    typeof status !== "string" ||
    typeof variant_id !== "string" ||
    typeof cycle_weeks !== "number"
  ) {
    return null
  }

  let next_renewal_at: string | null = null
  if (typeof value.next_renewal_at === "string") {
    next_renewal_at = value.next_renewal_at
  } else if (value.next_renewal_at === null) {
    next_renewal_at = null
  }

  let discount_percent: number | null = null
  if (typeof value.discount_percent === "number") {
    discount_percent = value.discount_percent
  } else if (value.discount_percent === null) {
    discount_percent = null
  }

  let customer_display: string | null = null
  if (typeof value.customer_display === "string") {
    customer_display = value.customer_display
  } else if (value.customer_display === null) {
    customer_display = null
  }

  let product_label: string | null = null
  if (typeof value.product_label === "string") {
    product_label = value.product_label
  } else if (value.product_label === null) {
    product_label = null
  }

  return {
    id,
    customer_id,
    status,
    cycle_weeks,
    next_renewal_at,
    variant_id,
    discount_percent,
    customer_display,
    product_label,
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

  if (typeof value.count !== "number" || typeof value.limit !== "number" || typeof value.offset !== "number") {
    return null
  }

  return {
    data,
    count: value.count,
    limit: value.limit,
    offset: value.offset,
  }
}
