import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { refetchEntity } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { sendZodError } from "../../../../http/zod-error"
import { enrichSubscriptionsForAdmin } from "../../../enrich-subscriptions"
import { listSubscriptionsQuerySchema } from "../../../../../modules/subscription/http-schemas"
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription"
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
    sendZodError(res, parsed.error)
    return
  }

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

  const filters: Record<string, unknown> = { customer_id: customerId }

  const [subscriptions, count] = await service.listAndCountSubscriptions(
    filters,
    {
      skip: parsed.data.offset,
      take: parsed.data.limit,
      order: { next_renewal_at: "ASC" },
    }
  )

  const data = await enrichSubscriptionsForAdmin(req.scope, subscriptions)

  res.status(200).json({
    data,
    count,
    limit: parsed.data.limit,
    offset: parsed.data.offset,
  })
}
