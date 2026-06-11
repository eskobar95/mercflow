import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../../http/admin-list-limit"
import { subscriptionToAdminListJson } from "../../http/subscription-json"
import { sendZodError } from "../../http/zod-error"
import { enrichSubscriptionsForAdmin } from "../enrich-subscriptions"
import { listSubscriptionsQuerySchema } from "../../../modules/subscription/http-schemas"
import { SUBSCRIPTION_MODULE } from "../../../modules/subscription"
import { resolveMercflowStoreId } from "../../../modules/subscription/resolve-store-id"
import type SubscriptionModuleService from "../../../modules/subscription/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = listSubscriptionsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const limit = Math.min(resolveAdminListLimit(parsed.data.limit), 100)
  const offset = resolveAdminListOffset(parsed.data.offset)
  const storeId = resolveMercflowStoreId(req)

  const service = req.scope.resolve(
    SUBSCRIPTION_MODULE
  ) as SubscriptionModuleService

  const filters: { status?: typeof parsed.data.status; customer_id?: string } = {}
  if (parsed.data.status != null) {
    filters.status = parsed.data.status
  }
  if (parsed.data.customer_id != null) {
    filters.customer_id = parsed.data.customer_id
  }

  const { subscriptions, count } = await service.listSubscriptions(storeId, filters, {
    limit,
    offset,
  })

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
