import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../../http/admin-list-limit"
import { supplierToAdminJson } from "../../http/supplier-json"
import { sendZodError } from "../../http/zod-error"
import { INVENTORY_MODULE } from "../../../modules/inventory"
import {
  adminListQuerySchema,
  supplierPostBodySchema,
} from "../../../modules/inventory/http-schemas"
import { resolveMercflowStoreId } from "../../../modules/inventory/resolve-store-id"
import type InventoryModuleService from "../../../modules/inventory/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = adminListQuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const limit = Math.min(resolveAdminListLimit(parsed.data.limit), 100)
  const offset = resolveAdminListOffset(parsed.data.offset)

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const { suppliers, count } = await service.listSuppliers(storeId, { limit, offset })
  res.status(200).json({
    suppliers: suppliers.map((r) => supplierToAdminJson(r)),
    count,
    limit,
    offset,
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const parsed = supplierPostBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const row = await service.createSupplier(storeId, parsed.data)
  res.status(201).json({ supplier: supplierToAdminJson(row) })
}
