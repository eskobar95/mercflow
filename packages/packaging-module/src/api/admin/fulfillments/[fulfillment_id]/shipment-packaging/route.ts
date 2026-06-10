import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { refetchEntity } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { shipmentPackagingToAdminJson } from "../../../../http/shipment-packaging-json"
import { sendZodError } from "../../../../http/zod-error"
import { PACKAGING_MODULE } from "../../../../../modules/packaging"
import { shipmentPackagingPutBodySchema } from "../../../../../modules/packaging/http-schemas"
import { resolveMercflowStoreId } from "../../../../../modules/packaging/resolve-store-id"
import type PackagingModuleService from "../../../../../modules/packaging/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const fulfillmentId = req.params.fulfillment_id
  if (!fulfillmentId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing fulfillment id")
  }

  const fulfillment = await refetchEntity({
    entity: "fulfillment",
    idOrFilter: fulfillmentId,
    scope: req.scope,
    fields: ["id"],
  })
  if (!fulfillment) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Fulfillment with id "${fulfillmentId}" not found`
    )
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(PACKAGING_MODULE) as unknown as PackagingModuleService
  const row = await service.retrieveShipmentPackaging(storeId, fulfillmentId)
  if (!row) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Shipment packaging for fulfillment "${fulfillmentId}" not found`
    )
  }

  res.status(200).json({ shipment_packaging: shipmentPackagingToAdminJson(row) })
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const fulfillmentId = req.params.fulfillment_id
  if (!fulfillmentId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing fulfillment id")
  }

  const parsed = shipmentPackagingPutBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const fulfillment = await refetchEntity({
    entity: "fulfillment",
    idOrFilter: fulfillmentId,
    scope: req.scope,
    fields: ["id"],
  })
  if (!fulfillment) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Fulfillment with id "${fulfillmentId}" not found`
    )
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(PACKAGING_MODULE) as unknown as PackagingModuleService
  const row = await service.upsertShipmentPackaging({
    storeId,
    fulfillmentId,
    packagingTypeId: parsed.data.packaging_type_id,
  })
  res.status(200).json({ shipment_packaging: shipmentPackagingToAdminJson(row) })
}
