import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { enrichPromotionToDiscountDetail, asPromotionRecords } from "../../../../../lib/discounts/enrichment"
import {
  getPromotionById,
  setPromotionStatus,
} from "../../../../../lib/discounts/promotion-service"
import { resolveMercflowStoreId } from "../../../../../lib/discounts/resolve-store-id"

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const promotionId = req.params.id

  if (typeof promotionId !== "string" || promotionId.trim() === "") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Discount id is required")
  }

  const existing = await getPromotionById(req.scope, promotionId)
  if (existing === null) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Discount ${promotionId} was not found`)
  }

  const promotion = await setPromotionStatus(req.scope, promotionId, "inactive")
  res.status(200).json({
    discount: enrichPromotionToDiscountDetail(storeId, asPromotionRecords([promotion])[0]),
  })
}
