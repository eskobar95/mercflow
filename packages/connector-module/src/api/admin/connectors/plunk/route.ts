import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../../../api/http/zod-error"
import { CONNECTOR_MODULE } from "../../../../modules/connector"
import { patchPlunkConnectorSchema } from "../../../../modules/connector/http-schemas"
import type ConnectorModuleService from "../../../../modules/connector/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const data = await service.getPlunkConnectorForAdmin()
  res.status(200).json({ data })
}

export const PATCH = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = patchPlunkConnectorSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const data = await service.upsertPlunkCredentials(parsed.data)
  res.status(200).json({ data })
}
