import { toIso } from "./iso"
import type { SubscriptionConfigAdminDto, SubscriptionConfigRecord } from "./types"

function toDecimalString(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === "number") {
    return String(value)
  }
  const trimmed = value.trim()
  return trimmed !== "" ? trimmed : null
}

export function subscriptionConfigToAdminJson(
  record: SubscriptionConfigRecord
): SubscriptionConfigAdminDto {
  return {
    id: record.id,
    store_id: record.store_id,
    club_enabled: record.club_enabled,
    club_stripe_product_id: record.club_stripe_product_id,
    club_name: record.club_name,
    club_price_monthly: toDecimalString(record.club_price_monthly),
    club_price_annual: toDecimalString(record.club_price_annual),
    club_fallback_discount_pct: toDecimalString(record.club_fallback_discount_pct),
    created_at: toIso(record.created_at),
    updated_at: toIso(record.updated_at),
  }
}
