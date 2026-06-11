import type { AdminRenewalLogRow, AdminSubscriptionDetail } from "./types"
import { parseSubscriptionRow } from "./parseSubscriptionsListResponse"

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

function pickRenewalLog(value: unknown): AdminRenewalLogRow | null {
  if (!isRecord(value)) {
    return null
  }
  const id = value.id
  const order_id = value.order_id
  const amount = value.amount
  const currency = value.currency
  const status = value.status
  const created_at = value.created_at
  if (
    typeof id !== "string" ||
    typeof order_id !== "string" ||
    typeof amount !== "string" ||
    typeof currency !== "string" ||
    typeof status !== "string" ||
    typeof created_at !== "string"
  ) {
    return null
  }
  return {
    id,
    order_id,
    amount,
    currency,
    status,
    stripe_payment_intent_id: pickNullableString(value.stripe_payment_intent_id),
    error_message: pickNullableString(value.error_message),
    created_at,
  }
}

export function parseSubscriptionDetailEnvelope(value: unknown): AdminSubscriptionDetail | null {
  if (!isRecord(value)) {
    return null
  }
  const payload = isRecord(value.data) ? value.data : value
  const row = parseSubscriptionRow(payload)
  if (row === null) {
    return null
  }
  if (!Array.isArray(payload.renewal_logs)) {
    return null
  }
  const renewal_logs: AdminRenewalLogRow[] = []
  for (const entry of payload.renewal_logs) {
    const log = pickRenewalLog(entry)
    if (log === null) {
      return null
    }
    renewal_logs.push(log)
  }
  return {
    ...row,
    renewal_logs,
  }
}
