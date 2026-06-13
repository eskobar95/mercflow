import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"
import { PAYMENT_MODULE } from "@mercflow/payment-module"
import type { PaymentModuleService } from "@mercflow/payment-module"

import { sendZodError } from "../../http/zod-error"
import { upsertSubscriptionConfigBodySchema } from "../../../modules/subscription/http-schemas"
import { SUBSCRIPTION_MODULE } from "../../../modules/subscription"
import { resolveMercflowStoreId } from "../../../modules/subscription/resolve-store-id"
import { subscriptionConfigToAdminJson } from "../../../modules/subscription/subscription-config-json"
import type SubscriptionModuleService from "../../../modules/subscription/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(SUBSCRIPTION_MODULE) as SubscriptionModuleService
  const config = await service.getOrCreateSubscriptionConfig(storeId)
  res.status(200).json({ subscription_config: subscriptionConfigToAdminJson(config) })
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const body = upsertSubscriptionConfigBodySchema.safeParse(req.body ?? {})
  if (!body.success) {
    sendZodError(body.error)
  }

  const paymentService = req.scope.resolve(PAYMENT_MODULE) as unknown as PaymentModuleService

  if (body.data.club_enabled) {
    const providerConfig = await paymentService.getProviderConfig(storeId)
    if (providerConfig === null) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Stripe is not configured — connect Stripe before enabling Customer Club"
      )
    }
  }

  const service = req.scope.resolve(SUBSCRIPTION_MODULE) as SubscriptionModuleService
  const config = await service.upsertSubscriptionConfig(storeId, body.data, {
    scope: req.scope,
    paymentService,
  })

  res.status(200).json({ subscription_config: subscriptionConfigToAdminJson(config) })
}
