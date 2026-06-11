import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../../http/zod-error"
import { NOTIFICATION_MODULE } from "../../../../modules/notification"
import { setupDomainBodySchema } from "../../../../modules/notification/http-schemas"
import { resolveMercflowStoreId } from "../../../../modules/notification/resolve-store-id"
import type NotificationModuleService from "../../../../modules/notification/service"

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = setupDomainBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(NOTIFICATION_MODULE) as unknown as NotificationModuleService
  const result = await service.setupDomain(storeId, parsed.data.domain)
  res.status(200).json({
    domain: result.domain,
    records: result.records,
    ses_domain_status: result.ses_domain_status,
    fallback_from: result.fallback_from,
  })
}
