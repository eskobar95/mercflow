import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { enrichSubscriptionsForAdmin } from "../../enrich-subscriptions"
import { SUBSCRIPTION_MODULE } from "../../../../modules/subscription"
import type SubscriptionModuleService from "../../../../modules/subscription/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const subscriptionId = req.params.id
  if (subscriptionId == null || subscriptionId.trim() === "") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Missing subscription id"
    )
  }

  const service = req.scope.resolve(
    SUBSCRIPTION_MODULE
  ) as SubscriptionModuleService

  const subscription = await service.retrieveSubscription(subscriptionId)

  const [withLabels] = await enrichSubscriptionsForAdmin(req.scope, [subscription])

  res.status(200).json({
    data: withLabels,
  })
}
