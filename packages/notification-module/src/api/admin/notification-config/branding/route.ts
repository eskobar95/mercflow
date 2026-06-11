import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { emailConfigToAdminJson } from "../../../http/notification-json"
import { sendZodError } from "../../../http/zod-error"
import { NOTIFICATION_MODULE } from "../../../../modules/notification"
import { updateEmailConfigBrandingBodySchema } from "../../../../modules/notification/http-schemas"
import { resolveMercflowStoreId } from "../../../../modules/notification/resolve-store-id"
import type NotificationModuleService from "../../../../modules/notification/service"

export const PUT = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = updateEmailConfigBrandingBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(NOTIFICATION_MODULE) as unknown as NotificationModuleService
  const config = await service.updateEmailConfig(storeId, parsed.data)
  res.status(200).json({ email_config: emailConfigToAdminJson(config) })
}
