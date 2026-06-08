import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../../../api/http/zod-error"
import { CONNECTOR_MODULE } from "../../../../modules/connector"
import { gtmPatchBodySchema } from "../../../../modules/connector/http-schemas"
import type ConnectorModuleService from "../../../../modules/connector/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const container_id = await service.gtm().get()
  res.status(200).json({ container_id })
}

export const PATCH = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const body = gtmPatchBodySchema.safeParse(req.body ?? {})
  if (!body.success) {
    sendZodError(body.error)
  }

  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  await service.gtm().save(body.data.container_id)
  const container_id = await service.gtm().get()
  res.status(200).json({ container_id })
}
