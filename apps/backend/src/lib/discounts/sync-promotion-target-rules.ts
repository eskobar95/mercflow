import { batchPromotionRulesWorkflow } from "@medusajs/core-flows"
import type { MedusaContainer } from "@medusajs/framework/types"
import type { PromotionRuleOperatorValues } from "@medusajs/framework/types"
import { RuleType } from "@medusajs/framework/utils"

import type { UpdateDiscountBody } from "./schemas"
import {
  buildTargetRulesFromDiscountBody,
  parseTargetRules,
  type ParsedTargetRules,
} from "./promotion-target-rules"

type ExistingRule = {
  id: string
  attribute: string
  operator: string
}

function ruleKey(attribute: string, operator: string): string {
  return `${attribute}::${operator}`
}

function readExistingTargetRules(promotion: Record<string, unknown>): ExistingRule[] {
  const applicationMethod = promotion.application_method
  if (typeof applicationMethod !== "object" || applicationMethod === null) {
    return []
  }
  const rawRules = (applicationMethod as Record<string, unknown>).target_rules
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

export function bodyTouchesTargetRuleFields(body: UpdateDiscountBody): boolean {
  return body.collection_ids !== undefined || body.product_ids !== undefined
}

function mergeTargetFieldsForUpdate(
  body: UpdateDiscountBody,
  existing: ParsedTargetRules,
): UpdateDiscountBody {
  const merged: UpdateDiscountBody = {}

  if (body.collection_ids !== undefined) {
    merged.collection_ids = body.collection_ids
  } else if (existing.collection_ids.length > 0) {
    merged.collection_ids = existing.collection_ids
  }

  if (body.product_ids !== undefined) {
    merged.product_ids = body.product_ids
  } else if (existing.product_ids.length > 0) {
    merged.product_ids = existing.product_ids
  }

  return merged
}

export async function syncPromotionTargetRulesFromUpdateBody(
  scope: MedusaContainer,
  promotionId: string,
  promotion: Record<string, unknown>,
  body: UpdateDiscountBody,
): Promise<void> {
  if (!bodyTouchesTargetRuleFields(body)) {
    return
  }

  const applicationMethod = promotion.application_method
  const existingParsed = parseTargetRules(
    typeof applicationMethod === "object" && applicationMethod !== null
      ? (applicationMethod as Record<string, unknown>).target_rules
      : undefined,
  )
  const merged = mergeTargetFieldsForUpdate(body, existingParsed)
  const desiredRules = buildTargetRulesFromDiscountBody(merged)
  const existingRules = readExistingTargetRules(promotion)

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
    update.push({ id: existing.id, values: desired.values })
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
      rule_type: RuleType.TARGET_RULES,
      create,
      update,
      delete: del,
    },
  })
}
