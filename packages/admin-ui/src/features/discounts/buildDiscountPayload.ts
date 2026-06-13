import type { DiscountFormCoreState, DiscountFormType } from "./discountFormTypes"
import type { CreateDiscountPayload } from "./discountsApi"

export type UpdateDiscountPayload = Partial<CreateDiscountPayload>

function parseOptionalPositiveInt(value: string): number | null | undefined {
  const trimmed = value.trim()
  if (trimmed === "") {
    return null
  }
  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return undefined
  }
  return parsed
}

function parseOptionalAmount(value: string): number | null | undefined {
  const trimmed = value.trim()
  if (trimmed === "") {
    return null
  }
  const parsed = Number.parseFloat(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined
  }
  return parsed
}

function parseDateTimeLocalToIso(value: string): string | undefined {
  const trimmed = value.trim()
  if (trimmed === "") {
    return undefined
  }
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }
  return date.toISOString()
}

function resolveTargetType(discountType: DiscountFormType): "order" | "items" | "shipping_methods" {
  if (discountType === "order") {
    return "order"
  }
  if (discountType === "free_shipping") {
    return "shipping_methods"
  }
  return "items"
}

export function buildCreateDiscountPayload(
  discountType: "product" | "order",
  form: DiscountFormCoreState,
  options?: { status?: "draft" | "active" | "inactive" },
): CreateDiscountPayload | null {
  const name = form.name.trim()
  if (name === "") {
    return null
  }

  const numericValue = Number.parseFloat(form.value)
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null
  }

  if (form.method === "code" && form.code.trim() === "") {
    return null
  }

  const usageLimit = parseOptionalPositiveInt(form.conditions.usageLimitTotal)
  if (usageLimit === undefined) {
    return null
  }

  const minPurchase = parseOptionalAmount(form.conditions.minPurchaseAmount)
  if (minPurchase === undefined) {
    return null
  }

  const payload: CreateDiscountPayload = {
    name,
    discount_type: discountType,
    method: form.method,
    status: options?.status ?? "draft",
    application_method: {
      type: form.valueType,
      value: numericValue,
      target_type: resolveTargetType(discountType),
    },
  }

  if (form.method === "code") {
    payload.code = form.code.trim().toUpperCase()
  }

  if (form.method === "code" && usageLimit !== null) {
    payload.usage_limit = usageLimit
  }

  if (minPurchase !== null) {
    payload.minimum_purchase_amount = minPurchase
  }

  const startsAt = parseDateTimeLocalToIso(form.conditions.startsAt)
  if (startsAt !== undefined) {
    payload.starts_at = startsAt
  }

  const endsAtRaw = form.conditions.endsAt.trim()
  if (endsAtRaw !== "") {
    const endsAt = parseDateTimeLocalToIso(endsAtRaw)
    if (endsAt === undefined) {
      return null
    }
    payload.ends_at = endsAt
  } else {
    payload.ends_at = null
  }

  return payload
}

export function buildUpdateDiscountPayload(
  discountType: "product" | "order",
  form: DiscountFormCoreState,
): UpdateDiscountPayload | null {
  return buildCreateDiscountPayload(discountType, form)
}
