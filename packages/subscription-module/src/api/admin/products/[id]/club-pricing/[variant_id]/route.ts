import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { deleteClubMemberPrice } from "../../../../../../modules/subscription/club-pricing"
import { SUBSCRIPTION_MODULE } from "../../../../../../modules/subscription"
import { resolveMercflowStoreId } from "../../../../../../modules/subscription/resolve-store-id"
import type SubscriptionModuleService from "../../../../../../modules/subscription/service"

export const DELETE = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const productId = req.params.id
  const variantId = req.params.variant_id

  if (productId == null || productId.trim() === "") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing product id")
  }
  if (variantId == null || variantId.trim() === "") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing variant id")
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(
    SUBSCRIPTION_MODULE
  ) as SubscriptionModuleService

  await deleteClubMemberPrice(req.scope, service, storeId, productId, variantId)

  res.status(200).json({
    data: {
      variant_id: variantId,
      deleted: true,
    },
  })
}
