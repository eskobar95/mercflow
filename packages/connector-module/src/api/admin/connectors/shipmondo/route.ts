import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../../http/zod-error"
import { CONNECTOR_MODULE } from "../../../../modules/connector"
import type ConnectorModuleService from "../../../../modules/connector/service"
import { shipmondoPatchBodySchema } from "../../../../modules/connector/http-schemas"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const data = await service.getShipmondoAdminPayload()
  res.status(200).json({ data })
}

export const PATCH = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = shipmondoPatchBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(res, parsed.error)
    return
  }

  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const data = await service.patchShipmondo(parsed.data)
  res.status(200).json({ data })
}
