import { PromotionRuleOperator } from "@medusajs/framework/utils"

import type { CreateDiscountBody, UpdateDiscountBody } from "./schemas"

const COLLECTION_ATTRIBUTE = "items.product.collection_id"
const PRODUCT_ATTRIBUTE = "items.product.id"

export type ParsedTargetRules = {
  applies_to: "all" | "collections" | "products"
  collection_ids: string[]
  product_ids: string[]
}

type TargetRuleInput = {
  attribute: string
  operator: string
  values: string[]
}

export function buildTargetRulesFromDiscountBody(
  body: CreateDiscountBody | UpdateDiscountBody,
): TargetRuleInput[] {
  const rules: TargetRuleInput[] = []

  if (body.collection_ids !== undefined && body.collection_ids.length > 0) {
    rules.push({
      attribute: COLLECTION_ATTRIBUTE,
      operator: PromotionRuleOperator.IN,
      values: body.collection_ids,
    })
  }

  if (body.product_ids !== undefined && body.product_ids.length > 0) {
    rules.push({
      attribute: PRODUCT_ATTRIBUTE,
      operator: PromotionRuleOperator.IN,
      values: body.product_ids,
    })
  }

  return rules
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

export function parseTargetRules(targetRules: unknown): ParsedTargetRules {
  const result: ParsedTargetRules = {
    applies_to: "all",
    collection_ids: [],
    product_ids: [],
  }

  if (!Array.isArray(targetRules)) {
    return result
  }

  for (const raw of targetRules) {
    if (typeof raw !== "object" || raw === null) {
      continue
    }
    const rule = raw as Record<string, unknown>
    const attribute = typeof rule.attribute === "string" ? rule.attribute : ""
    const operator = typeof rule.operator === "string" ? rule.operator : ""

    if (operator !== PromotionRuleOperator.IN) {
      continue
    }

    if (attribute === COLLECTION_ATTRIBUTE) {
      result.collection_ids.push(...readRuleValues(rule.values))
    }

    if (attribute === PRODUCT_ATTRIBUTE) {
      result.product_ids.push(...readRuleValues(rule.values))
    }
  }

  if (result.collection_ids.length > 0) {
    result.applies_to = "collections"
  } else if (result.product_ids.length > 0) {
    result.applies_to = "products"
  }

  return result
}

export function formatCatalogTargetingLabel(input: ParsedTargetRules): string | null {
  if (input.applies_to === "all") {
    return "All products"
  }

  if (input.applies_to === "collections") {
    const count = input.collection_ids.length
    return count === 1
      ? "Specific collection (1 selected)"
      : `Specific collections (${count} selected)`
  }

  const count = input.product_ids.length
  return count === 1
    ? "Specific product (1 selected)"
    : `Specific products (${count} selected)`
}

export { COLLECTION_ATTRIBUTE, PRODUCT_ATTRIBUTE }
