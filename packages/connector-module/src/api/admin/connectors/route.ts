import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { CONNECTOR_MODULE } from "../../../modules/connector"
import type ConnectorModuleService from "../../../modules/connector/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const connectors = await service.listConnectorsForAdmin()
  res.status(200).json({ connectors })
}
