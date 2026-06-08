import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../../../http/zod-error"
import { CONNECTOR_MODULE } from "../../../../../modules/connector"
import type ConnectorModuleService from "../../../../../modules/connector/service"
import { shipmondoPatchShippingRulesBodySchema } from "../../../../../modules/connector/http-schemas"

export const PATCH = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = shipmondoPatchShippingRulesBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const data = await service.patchShipmondoShippingRules(parsed.data)
  res.status(200).json({ data })
}
