import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  purchaseOrderLineToAdminJson,
  purchaseOrderToAdminJson,
} from "../../http/purchase-order-json"
import { sendZodError } from "../../http/zod-error"
import { INVENTORY_MODULE } from "../../../modules/inventory"
import { purchaseOrderPostBodySchema } from "../../../modules/inventory/http-schemas"
import { resolveMercflowStoreId } from "../../../modules/inventory/resolve-store-id"
import type InventoryModuleService from "../../../modules/inventory/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const orders = await service.listPurchaseOrders(storeId)

  const purchase_orders = await Promise.all(
    orders.map(async (po) => {
      const lines = await service.listPurchaseOrderLines(storeId, po.id)
      return {
        ...purchaseOrderToAdminJson(po),
        lines: lines.map((line) => purchaseOrderLineToAdminJson(line)),
      }
    })
  )

  res.status(200).json({ purchase_orders })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const parsed = purchaseOrderPostBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(res, parsed.error)
    return
  }

  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const result = await service.createPurchaseOrder(storeId, parsed.data)
  res.status(201).json({
    purchase_order: purchaseOrderToAdminJson(result.purchase_order),
    lines: result.lines.map((line) => purchaseOrderLineToAdminJson(line)),
  })
}
