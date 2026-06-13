import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import {
  enrichPromotionToDiscountDetail,
  asPromotionRecords,
} from "../../../../lib/discounts/enrichment"
import {
  deletePromotion,
  getPromotionById,
  updatePromotion,
} from "../../../../lib/discounts/promotion-service"
import { resolveMercflowStoreId } from "../../../../lib/discounts/resolve-store-id"
import { updateDiscountBodySchema } from "../../../../lib/discounts/schemas"
import { sendZodError } from "../../../../lib/discounts/zod-error"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const promotionId = req.params.id

  if (typeof promotionId !== "string" || promotionId.trim() === "") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Discount id is required")
  }

  const promotion = await getPromotionById(req.scope, promotionId)
  if (promotion === null) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Discount ${promotionId} was not found`)
  }

  res.status(200).json({
    discount: enrichPromotionToDiscountDetail(storeId, asPromotionRecords([promotion])[0]),
  })
}

export const PATCH = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = updateDiscountBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveMercflowStoreId(req)
  const promotionId = req.params.id

  if (typeof promotionId !== "string" || promotionId.trim() === "") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Discount id is required")
  }

  const existing = await getPromotionById(req.scope, promotionId)
  if (existing === null) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Discount ${promotionId} was not found`)
  }

  const promotion = await updatePromotion(req.scope, promotionId, parsed.data)
  res.status(200).json({
    discount: enrichPromotionToDiscountDetail(storeId, asPromotionRecords([promotion])[0]),
  })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const promotionId = req.params.id

  if (typeof promotionId !== "string" || promotionId.trim() === "") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Discount id is required")
  }

  const existing = await getPromotionById(req.scope, promotionId)
  if (existing === null) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Discount ${promotionId} was not found`)
  }

  await deletePromotion(req.scope, promotionId)
  res.status(200).json({
    id: promotionId,
    store_id: storeId,
    object: "discount",
    deleted: true,
  })
}
