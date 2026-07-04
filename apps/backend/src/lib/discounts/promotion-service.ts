import {
  createPromotionsWorkflow,
  deletePromotionsWorkflow,
  updatePromotionsWorkflow,
} from "@medusajs/core-flows"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ApplicationMethodType,
  ContainerRegistrationKeys,
  MedusaError,
  PromotionStatus,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

import type { CreateDiscountBody, UpdateDiscountBody } from "./schemas"
import { buildPromotionRulesFromDiscountBody } from "./promotion-rules"
import { buildTargetRulesFromDiscountBody } from "./promotion-target-rules"
import { resolveStoreCurrencyCode } from "./resolve-store-currency"
import { syncPromotionRulesFromUpdateBody } from "./sync-promotion-rules"
import { syncPromotionTargetRulesFromUpdateBody } from "./sync-promotion-target-rules"

const PROMOTION_LIST_FIELDS = [
  "id",
  "code",
  "is_automatic",
  "type",
  "limit",
  "used",
  "status",
  "created_at",
  "updated_at",
  "application_method.target_type",
  "campaign.name",
  "campaign.ends_at",
]

const PROMOTION_DETAIL_FIELDS = [
  ...PROMOTION_LIST_FIELDS,
  "application_method.type",
  "application_method.value",
  "application_method.target_rules.id",
  "application_method.target_rules.attribute",
  "application_method.target_rules.operator",
  "application_method.target_rules.values.value",
  "campaign.starts_at",
  "rules.id",
  "rules.attribute",
  "rules.operator",
  "rules.values.value",
]

type PromotionFilters = {
  q?: string
  status?: string[]
}

function mapDiscountTypeToPromotion(
  discountType: CreateDiscountBody["discount_type"],
): {
  promotionType: "standard" | "buyget"
  targetType: "order" | "shipping_methods" | "items"
} {
  switch (discountType) {
    case "product":
      return { promotionType: "standard", targetType: "items" }
    case "order":
      return { promotionType: "standard", targetType: "order" }
    case "buyget":
      return { promotionType: "buyget", targetType: "items" }
    case "free_shipping":
      return { promotionType: "standard", targetType: "shipping_methods" }
    default: {
      const _exhaustive: never = discountType
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Unsupported discount type: ${String(_exhaustive)}`,
      )
    }
  }
}

function resolveApplicationMethodType(
  body: CreateDiscountBody | UpdateDiscountBody,
  fallback: ApplicationMethodType = ApplicationMethodType.PERCENTAGE,
): ApplicationMethodType {
  const fromBody = body.application_method?.type
  if (fromBody === "fixed") {
    return ApplicationMethodType.FIXED
  }
  if (fromBody === "percentage") {
    return ApplicationMethodType.PERCENTAGE
  }
  return fallback
}

function resolveDefaultAllocation(
  targetType: "order" | "shipping_methods" | "items",
  explicit?: "each" | "across" | "once",
): "each" | "across" | "once" {
  if (explicit !== undefined) {
    return explicit
  }
  if (targetType === "shipping_methods") {
    return "across"
  }
  return "each"
}

function buildCreatePromotionPayload(
  body: CreateDiscountBody,
  currencyCode: string,
): Record<string, unknown> {
  const mapped = mapDiscountTypeToPromotion(body.discount_type)
  const isAutomatic = body.method === "automatic"
  const code = body.code?.trim() ?? body.name.trim().replace(/\s+/g, "-").toUpperCase()

  const allocation = resolveDefaultAllocation(
    mapped.targetType,
    body.application_method?.allocation,
  )

  const applicationMethod: Record<string, unknown> = {
    type: resolveApplicationMethodType(body),
    target_type: mapped.targetType,
    value: body.application_method?.value ?? (mapped.targetType === "shipping_methods" ? 100 : 10),
    allocation,
  }

  if (allocation === "each" || allocation === "once") {
    applicationMethod.max_quantity = 1
  }

  if (body.application_method?.currency_code !== undefined) {
    applicationMethod.currency_code = body.application_method.currency_code
  }

  if (mapped.promotionType === "buyget") {
    applicationMethod.buy_rules_min_quantity = body.application_method?.buy_rules_min_quantity ?? 2
    applicationMethod.apply_to_quantity = body.application_method?.apply_to_quantity ?? 1
  }

  const targetRules = buildTargetRulesFromDiscountBody(body)
  if (targetRules.length > 0) {
    applicationMethod.target_rules = targetRules
  }

  const payload: Record<string, unknown> = {
    code,
    type: mapped.promotionType,
    is_automatic: isAutomatic,
    status: body.status ?? PromotionStatus.DRAFT,
    application_method: applicationMethod,
  }

  if (body.usage_limit !== undefined) {
    payload.limit = body.usage_limit
  }

  payload.campaign = {
    name: body.name,
    campaign_identifier: code,
    ...(body.starts_at !== undefined ? { starts_at: body.starts_at } : {}),
    ...(body.ends_at !== undefined ? { ends_at: body.ends_at } : {}),
  }

  const rules = buildPromotionRulesFromDiscountBody(body, currencyCode)
  if (rules.length > 0) {
    payload.rules = rules
  }

  return payload
}

function buildUpdatePromotionPayload(
  promotionId: string,
  body: UpdateDiscountBody,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { id: promotionId }

  if (body.code !== undefined) {
    payload.code = body.code
  }

  if (body.method !== undefined) {
    payload.is_automatic = body.method === "automatic"
  }

  if (body.status !== undefined) {
    payload.status = body.status
  }

  if (body.usage_limit !== undefined) {
    payload.limit = body.usage_limit
  }

  if (body.discount_type !== undefined || body.application_method !== undefined) {
    const discountType = body.discount_type ?? "product"
    const mapped = mapDiscountTypeToPromotion(discountType)
    payload.type = mapped.promotionType
    payload.application_method = {
      type: resolveApplicationMethodType(body),
      target_type: body.application_method?.target_type ?? mapped.targetType,
      ...(body.application_method?.value !== undefined
        ? { value: body.application_method.value }
        : {}),
      ...(body.application_method?.currency_code !== undefined
        ? { currency_code: body.application_method.currency_code }
        : {}),
    }
  }

  if (body.name !== undefined || body.starts_at !== undefined || body.ends_at !== undefined) {
    payload.campaign = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.starts_at !== undefined ? { starts_at: body.starts_at } : {}),
      ...(body.ends_at !== undefined ? { ends_at: body.ends_at } : {}),
    }
  }

  return payload
}

export async function listPromotions(
  scope: MedusaContainer,
  filters: PromotionFilters,
  pagination: { limit: number; offset: number },
): Promise<{ promotions: Record<string, unknown>[]; count: number }> {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const promotionFilters: Record<string, unknown> = {}
  if (filters.q !== undefined && filters.q.trim() !== "") {
    promotionFilters.code = { $ilike: `%${filters.q.trim()}%` }
  }
  if (filters.status !== undefined && filters.status.length > 0) {
    promotionFilters.status = filters.status
  }

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "promotion",
    variables: {
      filters: promotionFilters,
      skip: pagination.offset,
      take: pagination.limit,
    },
    fields: PROMOTION_LIST_FIELDS,
  })

  const { rows, metadata } = await remoteQuery(queryObject)
  return {
    promotions: rows as Record<string, unknown>[],
    count: metadata.count as number,
  }
}

export async function getPromotionById(
  scope: MedusaContainer,
  promotionId: string,
): Promise<Record<string, unknown> | null> {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "promotion",
    variables: {
      filters: { id: promotionId },
    },
    fields: PROMOTION_DETAIL_FIELDS,
  })

  const rows = await remoteQuery(queryObject)
  return (rows[0] as Record<string, unknown> | undefined) ?? null
}

export async function createPromotion(
  scope: MedusaContainer,
  body: CreateDiscountBody,
): Promise<Record<string, unknown>> {
  const currencyCode = await resolveStoreCurrencyCode(scope)
  const createPromotions = createPromotionsWorkflow(scope)
  const promotionsData = [buildCreatePromotionPayload(body, currencyCode)]

  const { result } = await createPromotions.run({
    input: { promotionsData: promotionsData as never },
  })

  const createdId = result[0]?.id
  if (typeof createdId !== "string" || createdId === "") {
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Promotion create did not return an id")
  }

  const promotion = await getPromotionById(scope, createdId)
  if (promotion === null) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Promotion ${createdId} was not found after create`)
  }

  return promotion
}

export async function updatePromotion(
  scope: MedusaContainer,
  promotionId: string,
  body: UpdateDiscountBody,
): Promise<Record<string, unknown>> {
  const currencyCode = await resolveStoreCurrencyCode(scope)
  const existingPromotion = await getPromotionById(scope, promotionId)
  if (existingPromotion === null) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Promotion ${promotionId} was not found`)
  }

  const updatePromotions = updatePromotionsWorkflow(scope)
  const promotionsData = [buildUpdatePromotionPayload(promotionId, body)]

  await updatePromotions.run({
    input: { promotionsData: promotionsData as never },
  })

  await syncPromotionRulesFromUpdateBody(
    scope,
    promotionId,
    existingPromotion,
    body,
    currencyCode,
  )

  await syncPromotionTargetRulesFromUpdateBody(scope, promotionId, existingPromotion, body)

  const promotion = await getPromotionById(scope, promotionId)
  if (promotion === null) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Promotion ${promotionId} was not found`)
  }

  return promotion
}

export async function deletePromotion(scope: MedusaContainer, promotionId: string): Promise<void> {
  const deletePromotions = deletePromotionsWorkflow(scope)
  await deletePromotions.run({
    input: { ids: [promotionId] },
  })
}

export async function setPromotionStatus(
  scope: MedusaContainer,
  promotionId: string,
  status: "active" | "inactive",
): Promise<Record<string, unknown>> {
  return updatePromotion(scope, promotionId, { status })
}
