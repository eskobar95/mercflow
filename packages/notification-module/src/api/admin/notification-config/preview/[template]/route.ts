import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../../../http/zod-error"
import { NOTIFICATION_MODULE } from "../../../../../modules/notification"
import { emailPreviewQuerySchema } from "../../../../../modules/notification/http-schemas"
import { resolveMercflowStoreId } from "../../../../../modules/notification/resolve-store-id"
import type NotificationModuleService from "../../../../../modules/notification/service"
import { renderEmailPreviewHtml } from "../../../../../templates/render-email-preview"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const templateParam = req.params?.template
  const templateKey = typeof templateParam === "string" ? templateParam.trim() : ""
  if (templateKey === "") {
    res.status(400).json({ message: "template route parameter is required" })
    return
  }

  const parsed = emailPreviewQuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(NOTIFICATION_MODULE) as unknown as NotificationModuleService
  const config = await service.getEmailConfig(storeId)
  const html = renderEmailPreviewHtml(templateKey, config, parsed.data)

  res.status(200).json({ html, template: templateKey })
}
