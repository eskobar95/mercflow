import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../../../../api/http/zod-error"
import { CONNECTOR_MODULE } from "../../../../../modules/connector"
import { postPlunkConnectorTestSchema } from "../../../../../modules/connector/http-schemas"
import type ConnectorModuleService from "../../../../../modules/connector/service"

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = postPlunkConnectorTestSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(res, parsed.error)
    return
  }

  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const result = await service.runPlunkConnectionTest(parsed.data)
  const statusCode = result.success ? 200 : 502
  res.status(statusCode).json({ ...result })
}
