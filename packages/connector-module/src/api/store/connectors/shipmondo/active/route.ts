import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { CONNECTOR_MODULE } from "../../../../../modules/connector"
import type ConnectorModuleService from "../../../../../modules/connector/service"

/**
 * Lightweight read model for storefronts to hide Shipmondo shipping while the connector is inactive.
 *
 * Responses intentionally omit credential material.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const data = await service.getShipmondoStoreActivation()
  res.status(200).json({ data })
}
