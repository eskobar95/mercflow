import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { resolveAdminListLimit, resolveAdminListOffset } from "../../../lib/discounts/admin-list-limit"
import {
  enrichPromotionToDiscountDetail,
  enrichPromotionToDiscountRow,
  asPromotionRecords,
} from "../../../lib/discounts/enrichment"
import {
  createPromotion,
  listPromotions,
} from "../../../lib/discounts/promotion-service"
import { resolveMercflowStoreId } from "../../../lib/discounts/resolve-store-id"
import { resolveStoreCurrencyCode } from "../../../lib/discounts/resolve-store-currency"
import { createDiscountBodySchema, listDiscountsQuerySchema } from "../../../lib/discounts/schemas"
import { sendZodError } from "../../../lib/discounts/zod-error"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = listDiscountsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveMercflowStoreId(req)
  const limit = resolveAdminListLimit(parsed.data.limit)
  const offset = resolveAdminListOffset(parsed.data.offset)

  const statusFilter =
    parsed.data.status !== undefined ? [parsed.data.status] : undefined

  const { promotions, count } = await listPromotions(
    req.scope,
    {
      q: parsed.data.q,
      status: statusFilter,
    },
    { limit, offset },
  )

  const data = asPromotionRecords(promotions).map((promotion) =>
    enrichPromotionToDiscountRow(storeId, promotion),
  )

  res.status(200).json({
    data,
    count,
    limit,
    offset,
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = createDiscountBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveMercflowStoreId(req)

  try {
    const currencyCode = await resolveStoreCurrencyCode(req.scope)
    const promotion = await createPromotion(req.scope, parsed.data)
    res.status(200).json({
      discount: enrichPromotionToDiscountDetail(
        storeId,
        asPromotionRecords([promotion])[0],
        currencyCode,
      ),
    })
  } catch (error) {
    if (error instanceof MedusaError) {
      throw error
    }
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      error instanceof Error ? error.message : "Failed to create discount",
    )
  }
}
