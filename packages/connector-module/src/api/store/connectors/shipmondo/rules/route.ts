import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { CONNECTOR_MODULE } from "../../../../../modules/connector"
import type ConnectorModuleService from "../../../../../modules/connector/service"

/**
 * Public storefront read-model for Shipmondo shipping calculators — excludes secrets.
 *
 * Consumers should honor `active === false` the same way as `{GET} /store/connectors/shipmondo/active`,
 * including treating disabled carriers via `enabledCarrierCodes`.
 */
export const AUTHENTICATE = false

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const data = await service.getShipmondoStoreShippingRules()
  res.status(200).json({ data })
}
