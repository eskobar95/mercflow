import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { emailConfigToAdminJson } from "../../http/notification-json"
import { NOTIFICATION_MODULE } from "../../../modules/notification"
import { resolveMercflowStoreId } from "../../../modules/notification/resolve-store-id"
import type NotificationModuleService from "../../../modules/notification/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(NOTIFICATION_MODULE) as unknown as NotificationModuleService
  const config = await service.getEmailConfig(storeId)
  res.status(200).json({ email_config: emailConfigToAdminJson(config) })
}
