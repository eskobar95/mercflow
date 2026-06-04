import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { purchaseOrderDetailToAdminJson } from "../../../../http/purchase-order-json"
import { sendZodError } from "../../../../http/zod-error"
import { INVENTORY_MODULE } from "../../../../../modules/inventory"
import { purchaseOrderReceiveBodySchema } from "../../../../../modules/inventory/http-schemas"
import { resolveMercflowStoreId } from "../../../../../modules/inventory/resolve-store-id"
import type InventoryModuleService from "../../../../../modules/inventory/service"

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const poId = req.params.id
  if (!poId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing purchase order id")
  }

  const parsed = purchaseOrderReceiveBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(res, parsed.error)
    return
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const detail = await service.receivePurchaseOrder(storeId, poId, parsed.data)
  res.status(200).json(purchaseOrderDetailToAdminJson(detail))
}
