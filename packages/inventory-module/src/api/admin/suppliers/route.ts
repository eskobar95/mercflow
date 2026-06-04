import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { supplierToAdminJson } from "../../http/supplier-json"
import { sendZodError } from "../../http/zod-error"
import { INVENTORY_MODULE } from "../../../modules/inventory"
import { supplierPostBodySchema } from "../../../modules/inventory/http-schemas"
import { resolveMercflowStoreId } from "../../../modules/inventory/resolve-store-id"
import type InventoryModuleService from "../../../modules/inventory/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const rows = await service.listSuppliers(storeId)
  res.status(200).json({ suppliers: rows.map((r) => supplierToAdminJson(r)) })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const parsed = supplierPostBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(res, parsed.error)
    return
  }

  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const row = await service.createSupplier(storeId, parsed.data)
  res.status(201).json({ supplier: supplierToAdminJson(row) })
}
