import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"
import { refetchEntity } from "@medusajs/framework/http"

import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../../../../http/admin-list-limit"
import { subscriptionToAdminListJson } from "../../../../http/subscription-json"
import { sendZodError } from "../../../../http/zod-error"
import { enrichSubscriptionsForAdmin } from "../../../enrich-subscriptions"
import { listSubscriptionsQuerySchema } from "../../../../../modules/subscription/http-schemas"
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription"
import { resolveMercflowStoreId } from "../../../../../modules/subscription/resolve-store-id"
import type SubscriptionModuleService from "../../../../../modules/subscription/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const customerId = req.params.id
  if (customerId == null || customerId.trim() === "") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing customer id")
  }

  const parsed = listSubscriptionsQuerySchema.safeParse({
    ...req.query,
    customer_id: customerId,
  })
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const limit = Math.min(resolveAdminListLimit(parsed.data.limit), 100)
  const offset = resolveAdminListOffset(parsed.data.offset)
  const storeId = resolveMercflowStoreId(req)

  const customer = await refetchEntity({
    entity: "customer",
    idOrFilter: customerId,
    scope: req.scope,
    fields: ["id"],
  })
  if (!customer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Customer with id "${customerId}" not found`
    )
  }

  const service = req.scope.resolve(
    SUBSCRIPTION_MODULE
  ) as SubscriptionModuleService

  const { subscriptions, count } = await service.listSubscriptions(
    storeId,
    { customer_id: customerId, status: parsed.data.status },
    { limit, offset }
  )

  const labels = await enrichSubscriptionsForAdmin(req.scope, subscriptions)
  const data = subscriptions.map((row, index) =>
    subscriptionToAdminListJson(row, labels[index])
  )

  res.status(200).json({
    data,
    count,
    limit,
    offset,
  })
}
