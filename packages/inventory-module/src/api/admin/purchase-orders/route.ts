import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../../http/admin-list-limit"
import {
  purchaseOrderLineToAdminJson,
  purchaseOrderToAdminJson,
} from "../../http/purchase-order-json"
import { sendZodError } from "../../http/zod-error"
import { INVENTORY_MODULE } from "../../../modules/inventory"
import {
  adminListQuerySchema,
  purchaseOrderPostBodySchema,
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
  const { purchase_orders: orders, count } = await service.listPurchaseOrders(storeId, {
    limit,
    offset,
  })

  const purchase_orders = await Promise.all(
    orders.map(async (po) => {
      const lines = await service.listPurchaseOrderLines(storeId, po.id)
      return {
        ...purchaseOrderToAdminJson(po),
        lines: lines.map((line) => purchaseOrderLineToAdminJson(line)),
      }
    })
  )

  res.status(200).json({ purchase_orders, count, limit, offset })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const parsed = purchaseOrderPostBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const result = await service.createPurchaseOrder(storeId, parsed.data)
  res.status(201).json({
    purchase_order: purchaseOrderToAdminJson(result.purchase_order),
    lines: result.lines.map((line) => purchaseOrderLineToAdminJson(line)),
  })
}
