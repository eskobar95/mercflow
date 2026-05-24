import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { CONNECTOR_MODULE } from "../../../../../modules/connector"
import type ConnectorModuleService from "../../../../../modules/connector/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const svc = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const vat_mode = await svc.getStripeVatModeForStorefront()
  res.status(200).json({ data: { vat_mode } })
}
