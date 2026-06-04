import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { INVENTORY_MODULE } from "../../../../../modules/inventory"
import { resolveMercflowStoreId } from "../../../../../modules/inventory/resolve-store-id"
import type InventoryModuleService from "../../../../../modules/inventory/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const variantId = req.params.variantId
  if (!variantId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing variant id")
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const movements = await service.listVariantMovements(storeId, variantId)

  res.status(200).json({
    variant_id: variantId,
    movements,
  })
}
