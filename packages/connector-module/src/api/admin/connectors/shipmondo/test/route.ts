import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { CONNECTOR_MODULE } from "../../../../../modules/connector"
import type ConnectorModuleService from "../../../../../modules/connector/service"

/**
 * Validates stored Shipmondo credentials via the public shipments endpoint (no payloads returned here).
 *
 * Contract: `{ success: true, message }` when probe reaches HTTP 200, otherwise `{ success: false, error }`.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const result = await service.testShipmondoConnection()
  res.status(200).json(result)
}
