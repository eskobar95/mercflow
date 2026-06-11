import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { subscriptionToAdminListJson } from "../../../../http/subscription-json"
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription"
import { resolveMercflowStoreId } from "../../../../../modules/subscription/resolve-store-id"
import type SubscriptionModuleService from "../../../../../modules/subscription/service"

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const subscriptionId = req.params.id
  if (subscriptionId == null || subscriptionId.trim() === "") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Missing subscription id"
    )
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(
    SUBSCRIPTION_MODULE
  ) as SubscriptionModuleService

  const row = await service.resumeSubscription(storeId, subscriptionId)

  res.status(200).json({
    data: subscriptionToAdminListJson(row),
  })
}
