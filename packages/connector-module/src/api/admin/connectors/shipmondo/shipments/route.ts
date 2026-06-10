import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { resolveMercflowStoreId } from "../../../../http/resolve-mercflow-store-id"
import { sendZodError } from "../../../../http/zod-error"
import { CONNECTOR_MODULE } from "../../../../../modules/connector"
import type ConnectorModuleService from "../../../../../modules/connector/service"
import { postShipmondoShipmentBodySchema } from "../../../../../modules/connector/shipmondo-shipment-schemas"

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = postShipmondoShipmentBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(CONNECTOR_MODULE) as ConnectorModuleService
  const data = await service.createShipmentLabel({
    storeId,
    fulfillmentId: parsed.data.fulfillment_id,
    packagingTypeId: parsed.data.packaging_type_id ?? null,
    scope: req.scope,
  })

  res.status(200).json({ data })
}
