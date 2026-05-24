import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { CONNECTOR_MODULE } from "../../../../modules/connector"
import type ConnectorModuleService from "../../../../modules/connector/service"

/**
 * GET /store/connectors/gtm is intentionally public — container IDs are embedded in storefront pages.
 */
export const AUTHENTICATE = false

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const container_id = await service.gtm().get()
  res.status(200).json({ container_id })
}
