import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { sendZodError } from "../../../../http/zod-error"
import {
  getProductClubPricing,
  upsertClubMemberPrice,
} from "../../../../../modules/subscription/club-pricing"
import { upsertClubMemberPriceBodySchema } from "../../../../../modules/subscription/http-schemas"
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription"
import { resolveMercflowStoreId } from "../../../../../modules/subscription/resolve-store-id"
import type SubscriptionModuleService from "../../../../../modules/subscription/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const productId = req.params.id
  if (productId == null || productId.trim() === "") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing product id")
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(
    SUBSCRIPTION_MODULE
  ) as SubscriptionModuleService

  const payload = await getProductClubPricing(req.scope, service, storeId, productId)
  res.status(200).json({ data: payload })
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const productId = req.params.id
  if (productId == null || productId.trim() === "") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing product id")
  }

  const parsed = upsertClubMemberPriceBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(
    SUBSCRIPTION_MODULE
  ) as SubscriptionModuleService

  const price = await upsertClubMemberPrice(
    req.scope,
    service,
    storeId,
    productId,
    {
      variant_id: parsed.data.variant_id,
      amount: parsed.data.amount,
      currency_code: parsed.data.currency_code.trim().toLowerCase(),
    }
  )

  res.status(200).json({ data: price })
}
