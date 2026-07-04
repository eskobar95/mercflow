import { PromotionRuleOperator } from "@medusajs/framework/utils"

import type { CreateDiscountBody, UpdateDiscountBody } from "./schemas"

export type ParsedPromotionRules = {
  minimum_order_amount: number | null
  maximum_order_amount: number | null
  shipping_country_codes: string[] | null
}

const SUBTOTAL_ATTRIBUTE = "subtotal"
const COUNTRY_ATTRIBUTE = "shipping_address.country_code"

function currencyMinorFactor(currencyCode: string): number {
  const normalized = currencyCode.trim().toLowerCase()
  if (normalized === "jpy" || normalized === "krw") {
    return 1
  }
  return 100
}

export function majorToMinorAmount(amount: number, currencyCode: string): number {
  const factor = currencyMinorFactor(currencyCode)
  return Math.round(amount * factor)
}

export function minorToMajorAmount(amountMinor: number, currencyCode: string): number {
  const factor = currencyMinorFactor(currencyCode)
  return amountMinor / factor
}

function readRuleValues(values: unknown): string[] {
  if (Array.isArray(values)) {
    return values.flatMap((entry) => {
      if (typeof entry === "object" && entry !== null && "value" in entry) {
        const nested = (entry as { value: unknown }).value
        return nested === undefined || nested === null ? [] : [String(nested)]
      }
      return [String(entry)]
    })
  }
  if (typeof values === "string") {
    return [values]
  }
  return []
}

function readNumericRuleValue(values: unknown): number | null {
  const list = readRuleValues(values)
  const first = list[0]
  if (first === undefined) {
    return null
  }
  const parsed = Number.parseFloat(first)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

export function buildPromotionRulesFromDiscountBody(
  body: CreateDiscountBody | UpdateDiscountBody,
  currencyCode: string,
): Array<{ attribute: string; operator: string; values: string[] }> {
  const rules: Array<{ attribute: string; operator: string; values: string[] }> = []

  if (body.minimum_purchase_amount !== undefined && body.minimum_purchase_amount >= 0) {
    rules.push({
      attribute: SUBTOTAL_ATTRIBUTE,
      operator: PromotionRuleOperator.GTE,
      values: [String(majorToMinorAmount(body.minimum_purchase_amount, currencyCode))],
    })
  }

  if (
    body.shipping_exclude_above !== undefined &&
    body.shipping_exclude_above !== null &&
    body.shipping_exclude_above >= 0
  ) {
    rules.push({
      attribute: SUBTOTAL_ATTRIBUTE,
      operator: PromotionRuleOperator.LTE,
      values: [String(majorToMinorAmount(body.shipping_exclude_above, currencyCode))],
    })
  }

  if (body.shipping_country_codes !== undefined && body.shipping_country_codes.length > 0) {
    rules.push({
      attribute: COUNTRY_ATTRIBUTE,
      operator: PromotionRuleOperator.IN,
      values: body.shipping_country_codes.map((code) => code.toUpperCase()),
    })
  }

  return rules
}

export function parsePromotionRules(
  rules: unknown,
  currencyCode: string,
): ParsedPromotionRules {
  const result: ParsedPromotionRules = {
    minimum_order_amount: null,
    maximum_order_amount: null,
    shipping_country_codes: null,
  }

  if (!Array.isArray(rules)) {
    return result
  }

  const countryCodes: string[] = []

  for (const raw of rules) {
    if (typeof raw !== "object" || raw === null) {
      continue
    }
    const rule = raw as Record<string, unknown>
    const attribute = typeof rule.attribute === "string" ? rule.attribute : ""
    const operator = typeof rule.operator === "string" ? rule.operator : ""
    const numericValue = readNumericRuleValue(rule.values)

    if (attribute === SUBTOTAL_ATTRIBUTE && operator === PromotionRuleOperator.GTE && numericValue !== null) {
      result.minimum_order_amount = minorToMajorAmount(numericValue, currencyCode)
    }

    if (attribute === SUBTOTAL_ATTRIBUTE && operator === PromotionRuleOperator.LTE && numericValue !== null) {
      result.maximum_order_amount = minorToMajorAmount(numericValue, currencyCode)
    }

    if (attribute === COUNTRY_ATTRIBUTE && operator === PromotionRuleOperator.IN) {
      countryCodes.push(...readRuleValues(rule.values).map((code) => code.toUpperCase()))
    }
  }

  if (countryCodes.length > 0) {
    result.shipping_country_codes = countryCodes
  }

  return result
}

export function formatFreeShippingConditionsLabel(input: {
  currencyCode: string
  minimumOrderAmount: number | null
  maximumOrderAmount: number | null
  countryCodes: string[] | null
}): string {
  const currency = input.currencyCode.toUpperCase()
  const parts: string[] = []

  if (input.minimumOrderAmount !== null) {
    parts.push(`order is at least ${input.minimumOrderAmount} ${currency}`)
  }

  if (input.maximumOrderAmount !== null) {
    parts.push(`order is at most ${input.maximumOrderAmount} ${currency}`)
  }

  if (input.countryCodes !== null && input.countryCodes.length > 0) {
    parts.push(`shipping country is ${input.countryCodes.join(", ")}`)
  }

  if (parts.length === 0) {
    return "All orders with shipping — no minimum order value"
  }

  return `When ${parts.join(" and ")}`
}
