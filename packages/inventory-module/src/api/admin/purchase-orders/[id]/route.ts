import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { purchaseOrderDetailToAdminJson } from "../../../http/purchase-order-json"
import { INVENTORY_MODULE } from "../../../../modules/inventory"
import { resolveMercflowStoreId } from "../../../../modules/inventory/resolve-store-id"
import type InventoryModuleService from "../../../../modules/inventory/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const poId = req.params.id
  if (!poId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing purchase order id")
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const detail = await service.retrievePurchaseOrder(storeId, poId)
  res.status(200).json(purchaseOrderDetailToAdminJson(detail))
}
