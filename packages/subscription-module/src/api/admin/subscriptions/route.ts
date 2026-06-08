import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../../http/admin-list-limit"
import { sendZodError } from "../../http/zod-error"
import { enrichSubscriptionsForAdmin } from "../enrich-subscriptions"
import { listSubscriptionsQuerySchema } from "../../../modules/subscription/http-schemas"
import { SUBSCRIPTION_MODULE } from "../../../modules/subscription"
import type SubscriptionModuleService from "../../../modules/subscription/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = listSubscriptionsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const limit = Math.min(resolveAdminListLimit(parsed.data.limit), 100)
  const offset = resolveAdminListOffset(parsed.data.offset)

  const service = req.scope.resolve(
    SUBSCRIPTION_MODULE
  ) as SubscriptionModuleService

  const filters: Record<string, unknown> = {}
  if (parsed.data.customer_id != null) {
    filters.customer_id = parsed.data.customer_id
  }

  const [subscriptions, count] = await service.listAndCountSubscriptions(
    filters,
    {
      skip: offset,
      take: limit,
      order: { next_renewal_at: "ASC" },
    }
  )

  const data = await enrichSubscriptionsForAdmin(req.scope, subscriptions)

  res.status(200).json({
    data,
    count,
    limit,
    offset,
  })
}
