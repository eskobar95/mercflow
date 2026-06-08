import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { purchaseOrderToAdminJson } from "../../../../http/purchase-order-json"
import { sendZodError } from "../../../../http/zod-error"
import { INVENTORY_MODULE } from "../../../../../modules/inventory"
import { purchaseOrderStatusPatchBodySchema } from "../../../../../modules/inventory/http-schemas"
import { resolveMercflowStoreId } from "../../../../../modules/inventory/resolve-store-id"
import type InventoryModuleService from "../../../../../modules/inventory/service"

export const PATCH = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const poId = req.params.id
  if (!poId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing purchase order id")
  }

  const parsed = purchaseOrderStatusPatchBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const row = await service.updatePurchaseOrderStatus(storeId, poId, parsed.data.status)
  res.status(200).json({ purchase_order: purchaseOrderToAdminJson(row) })
}
