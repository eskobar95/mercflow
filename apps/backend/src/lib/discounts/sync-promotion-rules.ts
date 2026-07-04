import { batchPromotionRulesWorkflow } from "@medusajs/core-flows"
import type { MedusaContainer } from "@medusajs/framework/types"
import { RuleType } from "@medusajs/framework/utils"
import type { PromotionRuleOperatorValues } from "@medusajs/framework/types"

import type { UpdateDiscountBody } from "./schemas"
import {
  buildPromotionRulesFromDiscountBody,
  parsePromotionRules,
  type ParsedPromotionRules,
} from "./promotion-rules"

type ExistingRule = {
  id: string
  attribute: string
  operator: string
}

function ruleKey(attribute: string, operator: string): string {
  return `${attribute}::${operator}`
}

function readExistingRules(promotion: Record<string, unknown>): ExistingRule[] {
  const rawRules = promotion.rules
  if (!Array.isArray(rawRules)) {
    return []
  }

  const rules: ExistingRule[] = []
  for (const raw of rawRules) {
    if (typeof raw !== "object" || raw === null) {
      continue
    }
    const rule = raw as Record<string, unknown>
    if (typeof rule.id !== "string" || typeof rule.attribute !== "string" || typeof rule.operator !== "string") {
      continue
    }
    rules.push({ id: rule.id, attribute: rule.attribute, operator: rule.operator })
  }
  return rules
}

function bodyTouchesRuleFields(body: UpdateDiscountBody): boolean {
  return (
    body.minimum_purchase_amount !== undefined ||
    body.shipping_exclude_above !== undefined ||
    body.shipping_country_codes !== undefined
  )
}

function mergeRuleFieldsForUpdate(
  body: UpdateDiscountBody,
  existing: ParsedPromotionRules,
): UpdateDiscountBody {
  const merged: UpdateDiscountBody = {}

  if (body.minimum_purchase_amount !== undefined) {
    merged.minimum_purchase_amount = body.minimum_purchase_amount
  } else if (existing.minimum_order_amount !== null) {
    merged.minimum_purchase_amount = existing.minimum_order_amount
  }

  if (body.shipping_exclude_above !== undefined) {
    merged.shipping_exclude_above = body.shipping_exclude_above
  } else if (existing.maximum_order_amount !== null) {
    merged.shipping_exclude_above = existing.maximum_order_amount
  }

  if (body.shipping_country_codes !== undefined) {
    merged.shipping_country_codes = body.shipping_country_codes
  } else if (existing.shipping_country_codes !== null) {
    merged.shipping_country_codes = existing.shipping_country_codes
  }

  return merged
}

export async function syncPromotionRulesFromUpdateBody(
  scope: MedusaContainer,
  promotionId: string,
  promotion: Record<string, unknown>,
  body: UpdateDiscountBody,
  currencyCode: string,
): Promise<void> {
  if (!bodyTouchesRuleFields(body)) {
    return
  }

  const existingParsed = parsePromotionRules(promotion.rules, currencyCode)
  const merged = mergeRuleFieldsForUpdate(body, existingParsed)
  const desiredRules = buildPromotionRulesFromDiscountBody(merged, currencyCode)
  const existingRules = readExistingRules(promotion)

  const desiredByKey = new Map(
    desiredRules.map((rule) => [ruleKey(rule.attribute, rule.operator), rule]),
  )
  const existingByKey = new Map(
    existingRules.map((rule) => [ruleKey(rule.attribute, rule.operator), rule]),
  )

  const create: Array<{
    attribute: string
    operator: PromotionRuleOperatorValues
    values: string[]
  }> = []
  const update: Array<{ id: string; values: string[] }> = []
  const del: string[] = []

  for (const [key, desired] of desiredByKey) {
    const existing = existingByKey.get(key)
    if (existing === undefined) {
      create.push({
        attribute: desired.attribute,
        operator: desired.operator as PromotionRuleOperatorValues,
        values: desired.values,
      })
      continue
    }

    const existingValues = desired.values
    update.push({ id: existing.id, values: existingValues })
  }

  for (const [key, existing] of existingByKey) {
    if (!desiredByKey.has(key)) {
      del.push(existing.id)
    }
  }

  if (create.length === 0 && update.length === 0 && del.length === 0) {
    return
  }

  const batchPromotionRules = batchPromotionRulesWorkflow(scope)
  await batchPromotionRules.run({
    input: {
      id: promotionId,
      rule_type: RuleType.RULES,
      create,
      update,
      delete: del,
    },
  })
}

export { bodyTouchesRuleFields }
