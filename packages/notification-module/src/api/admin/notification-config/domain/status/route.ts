import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { NOTIFICATION_MODULE } from "../../../../../modules/notification"
import { resolveMercflowStoreId } from "../../../../../modules/notification/resolve-store-id"
import type NotificationModuleService from "../../../../../modules/notification/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(NOTIFICATION_MODULE) as unknown as NotificationModuleService
  const result = await service.checkDomainStatus(storeId)
  res.status(200).json({
    status: result.status,
    records: result.records,
    fallback_from: result.fallback_from,
  })
}
