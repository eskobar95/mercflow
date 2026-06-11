import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { emailDeliveryToAdminJson } from "../../../../http/notification-json"
import { sendZodError } from "../../../../http/zod-error"
import { NOTIFICATION_MODULE } from "../../../../../modules/notification"
import {
  resendEmailBodySchema,
  resendEmailParamsSchema,
} from "../../../../../modules/notification/http-schemas"
import { resolveMercflowStoreId } from "../../../../../modules/notification/resolve-store-id"
import type NotificationModuleService from "../../../../../modules/notification/service"

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsedParams = resendEmailParamsSchema.safeParse(req.params ?? {})
  if (!parsedParams.success) {
    sendZodError(parsedParams.error)
  }

  const parsedBody = resendEmailBodySchema.safeParse(req.body ?? {})
  if (!parsedBody.success) {
    sendZodError(parsedBody.error)
  }

  const deliveryId = parsedParams.data.id
  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(NOTIFICATION_MODULE) as unknown as NotificationModuleService
  const result = await service.resendEmail(deliveryId, storeId)

  res.status(202).json({
    email_delivery: emailDeliveryToAdminJson(result.delivery),
    enqueued: result.enqueued,
  })
}
