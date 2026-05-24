import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { CONNECTOR_MODULE } from "../../../modules/connector"
import ConnectorConfigService from "../../../modules/connector/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorConfigService
  const data = await service.listConnectorAdminSummaries()
  res.status(200).json({ data })
}
