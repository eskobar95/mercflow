import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../../http/zod-error"
import { CONNECTOR_MODULE } from "../../../../modules/connector"
import type ConnectorModuleService from "../../../../modules/connector/service"
import { stripeConnectorPatchSchema } from "../../../../modules/connector/stripe-http-schemas"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const svc = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const data = await svc.getStripeAdminDetail()
  res.status(200).json({ data })
}

export const PATCH = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = stripeConnectorPatchSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const svc = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const data = await svc.patchStripeConnector(parsed.data)
  res.status(200).json({ data })
}
