import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { subscriptionDetailToAdminJson } from "../../../http/subscription-json"
import { enrichSubscriptionsForAdmin } from "../../enrich-subscriptions"
import { SUBSCRIPTION_MODULE } from "../../../../modules/subscription"
import { resolveMercflowStoreId } from "../../../../modules/subscription/resolve-store-id"
import type SubscriptionModuleService from "../../../../modules/subscription/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
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

  const detail = await service.getSubscription(storeId, subscriptionId)
  const [labels] = await enrichSubscriptionsForAdmin(req.scope, [detail.subscription])

  res.status(200).json({
    data: subscriptionDetailToAdminJson(
      detail.subscription,
      detail.renewal_logs,
      labels
    ),
  })
}
