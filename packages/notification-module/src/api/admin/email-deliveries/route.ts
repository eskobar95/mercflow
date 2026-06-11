import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../../http/admin-list-limit"
import { emailDeliveryToAdminJson } from "../../http/notification-json"
import { sendZodError } from "../../http/zod-error"
import { NOTIFICATION_MODULE } from "../../../modules/notification"
import { adminListQuerySchema } from "../../../modules/notification/http-schemas"
import { resolveMercflowStoreId } from "../../../modules/notification/resolve-store-id"
import type NotificationModuleService from "../../../modules/notification/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = adminListQuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const limit = resolveAdminListLimit(parsed.data.limit)
  const offset = resolveAdminListOffset(parsed.data.offset)
  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(NOTIFICATION_MODULE) as unknown as NotificationModuleService
  const { deliveries, count } = await service.listDeliveries(storeId, { limit, offset })

  res.status(200).json({
    email_deliveries: deliveries.map((row) => emailDeliveryToAdminJson(row)),
    count,
    limit,
    offset,
  })
}
