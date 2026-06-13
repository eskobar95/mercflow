import type {
  AdminDiscountDetail,
  AdminDiscountRow,
  DiscountMethodLabel,
  DiscountStatus,
  DiscountTypeApi,
  DiscountTypeLabel,
} from "./types"

type PromotionApplicationMethod = {
  target_type?: string | null
  type?: string | null
  value?: number | null
}

type PromotionCampaign = {
  name?: string | null
  starts_at?: string | Date | null
  ends_at?: string | Date | null
}

export type PromotionRecord = {
  id: string
  code?: string | null
  type?: string | null
  status?: string | null
  is_automatic?: boolean | null
  limit?: number | null
  used?: number | null
  created_at?: string | Date | null
  updated_at?: string | Date | null
  application_method?: PromotionApplicationMethod | null
  campaign?: PromotionCampaign | null
}

function asPromotionRecord(value: Record<string, unknown>): PromotionRecord {
  if (typeof value.id !== "string") {
    throw new Error("Promotion record missing id")
  }
  return value as PromotionRecord
}

export function asPromotionRecords(values: Record<string, unknown>[]): PromotionRecord[] {
  return values.map(asPromotionRecord)
}

function toIsoString(value: string | Date | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  return value
}

export function resolveDiscountTypeLabel(promotion: PromotionRecord): DiscountTypeLabel {
  if (promotion.type === "buyget") {
    return "Buy X get Y"
  }

  const targetType = promotion.application_method?.target_type
  if (targetType === "shipping_methods") {
    return "Free shipping"
  }
  if (targetType === "order") {
    return "Order"
  }
  return "Product"
}

export function resolveDiscountMethodLabel(isAutomatic: boolean): DiscountMethodLabel {
  return isAutomatic ? "Automatic" : "Code"
}

export function resolveDiscountStatus(
  status: string | null | undefined,
  expiresAt: string | null,
): DiscountStatus {
  if (expiresAt !== null) {
    const end = new Date(expiresAt)
    if (!Number.isNaN(end.getTime()) && end.getTime() < Date.now()) {
      return "expired"
    }
  }

  if (status === "active" || status === "inactive" || status === "draft") {
    return status
  }

  return "draft"
}

export function resolveDiscountName(promotion: PromotionRecord): string {
  const campaignName = promotion.campaign?.name?.trim()
  if (campaignName !== undefined && campaignName !== "") {
    return campaignName
  }

  const code = promotion.code?.trim()
  if (code !== undefined && code !== "") {
    return code
  }

  return "Untitled discount"
}

export function enrichPromotionToDiscountRow(
  storeId: string,
  promotion: PromotionRecord,
): AdminDiscountRow {
  const isAutomatic = promotion.is_automatic === true
  const expiresAt = toIsoString(promotion.campaign?.ends_at ?? null)

  return {
    id: promotion.id,
    store_id: storeId,
    name: resolveDiscountName(promotion),
    code: promotion.code ?? null,
    type: resolveDiscountTypeLabel(promotion),
    method: resolveDiscountMethodLabel(isAutomatic),
    status: resolveDiscountStatus(promotion.status ?? null, expiresAt),
    usage_count: promotion.used ?? 0,
    usage_limit: promotion.limit ?? null,
    expires_at: expiresAt,
    created_at: toIsoString(promotion.created_at ?? null),
    updated_at: toIsoString(promotion.updated_at ?? null),
  }
}

export function resolveDiscountTypeApi(promotion: PromotionRecord): DiscountTypeApi {
  if (promotion.type === "buyget") {
    return "buyget"
  }

  const targetType = promotion.application_method?.target_type
  if (targetType === "shipping_methods") {
    return "free_shipping"
  }
  if (targetType === "order") {
    return "order"
  }
  return "product"
}

function resolveValueType(
  applicationMethod: PromotionApplicationMethod | null | undefined,
): "percentage" | "fixed" | null {
  const rawType = applicationMethod?.type
  if (rawType === "percentage" || rawType === "fixed") {
    return rawType
  }
  return null
}

export function enrichPromotionToDiscountDetail(
  storeId: string,
  promotion: PromotionRecord,
): AdminDiscountDetail {
  const row = enrichPromotionToDiscountRow(storeId, promotion)
  const rawStatus = promotion.status
  const normalizedStatus =
    rawStatus === "active" || rawStatus === "inactive" || rawStatus === "draft"
      ? rawStatus
      : "draft"

  const applicationMethod = promotion.application_method
  const rawValue = applicationMethod?.value

  return {
    ...row,
    is_automatic: promotion.is_automatic === true,
    promotion_type: promotion.type === "buyget" ? "buyget" : "standard",
    raw_status: normalizedStatus,
    discount_type: resolveDiscountTypeApi(promotion),
    value_type: resolveValueType(applicationMethod),
    value: typeof rawValue === "number" && Number.isFinite(rawValue) ? rawValue : null,
    starts_at: toIsoString(promotion.campaign?.starts_at ?? null),
  }
}
