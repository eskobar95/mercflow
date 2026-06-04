import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { supplierToAdminJson } from "../../../http/supplier-json"
import { sendZodError } from "../../../http/zod-error"
import { INVENTORY_MODULE } from "../../../../modules/inventory"
import { supplierPatchBodySchema } from "../../../../modules/inventory/http-schemas"
import { resolveMercflowStoreId } from "../../../../modules/inventory/resolve-store-id"
import type InventoryModuleService from "../../../../modules/inventory/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const supplierId = req.params.id
  if (!supplierId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing supplier id")
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const row = await service.retrieveSupplier(storeId, supplierId)
  if (!row) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Supplier "${supplierId}" not found`)
  }
  res.status(200).json({ supplier: supplierToAdminJson(row) })
}

export const PATCH = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const supplierId = req.params.id
  if (!supplierId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing supplier id")
  }

  const parsed = supplierPatchBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(res, parsed.error)
    return
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const row = await service.updateSupplier(storeId, supplierId, parsed.data)
  res.status(200).json({ supplier: supplierToAdminJson(row) })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const supplierId = req.params.id
  if (!supplierId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing supplier id")
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  await service.deleteSupplier(storeId, supplierId)
  res.status(204).send()
}
