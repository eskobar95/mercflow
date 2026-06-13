import type {
  BuyXGetYFormValues,
  FreeShippingFormValues,
} from "./discountFormTypes"
import type { CreateDiscountPayload } from "./discountsApi"

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback
  }
  return parsed
}

function parseOptionalAmount(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === "") {
    return null
  }
  const parsed = Number.parseFloat(trimmed)
  if (Number.isNaN(parsed) || parsed < 0) {
    return null
  }
  return parsed
}

export function buildBuyXGetYCreatePayload(values: BuyXGetYFormValues): CreateDiscountPayload {
  const buyRulesMinQuantity =
    values.buyMinimumType === "quantity"
      ? parsePositiveInt(values.buyMinimumQuantity, 2)
      : 1
  const applyToQuantity = parsePositiveInt(values.getQuantity, 1)
  const maxUsesPerOrder = parsePositiveInt(values.maxUsesPerOrder, 1)

  let applicationType: "percentage" | "fixed" = "percentage"
  let applicationValue = 100

  if (values.getDiscountKind === "percentage") {
    applicationType = "percentage"
    applicationValue = parsePositiveInt(values.getPercentage, 100)
  } else if (values.getDiscountKind === "fixed") {
    applicationType = "fixed"
    applicationValue = parseOptionalAmount(values.getFixedAmount) ?? 0
  }

  const payload: CreateDiscountPayload = {
    name: values.name.trim(),
    discount_type: "buyget",
    method: values.method,
    status: "active",
    application_method: {
      type: applicationType,
      value: applicationValue,
      buy_rules_min_quantity: buyRulesMinQuantity,
      apply_to_quantity: applyToQuantity,
      allocation: maxUsesPerOrder === 1 ? "once" : "each",
    },
  }

  if (values.method === "code") {
    payload.code = values.code.trim()
  }

  if (values.buyMinimumType === "amount") {
    const minimumAmount = parseOptionalAmount(values.buyMinimumAmount)
    if (minimumAmount !== null) {
      payload.minimum_purchase_amount = minimumAmount
    }
  }

  return payload
}

export function buildFreeShippingCreatePayload(
  values: FreeShippingFormValues,
): CreateDiscountPayload {
  const payload: CreateDiscountPayload = {
    name: values.name.trim(),
    discount_type: "free_shipping",
    method: values.method,
    status: "active",
    application_method: {
      type: "percentage",
      value: 100,
      target_type: "shipping_methods",
    },
  }

  if (values.method === "code") {
    payload.code = values.code.trim()
  }

  if (values.countryMode === "specific" && values.countryCodes.length > 0) {
    payload.shipping_country_codes = values.countryCodes
  }

  const excludeAbove = parseOptionalAmount(values.excludeAbove)
  if (excludeAbove !== null) {
    payload.shipping_exclude_above = excludeAbove
  }

  return payload
}
