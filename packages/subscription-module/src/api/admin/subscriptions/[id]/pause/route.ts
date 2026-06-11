import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { subscriptionToAdminListJson } from "../../../../http/subscription-json"
import { sendZodError } from "../../../../http/zod-error"
import { pauseSubscriptionBodySchema } from "../../../../../modules/subscription/http-schemas"
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

  const parsed = pauseSubscriptionBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(
    SUBSCRIPTION_MODULE
  ) as SubscriptionModuleService

  const row = await service.pauseSubscription(storeId, subscriptionId, parsed.data)

  res.status(200).json({
    data: subscriptionToAdminListJson(row),
  })
}
