import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../http/zod-error"
import { INVENTORY_MODULE } from "../../../modules/inventory"
import { inventoryConfigPatchBodySchema } from "../../../modules/inventory/http-schemas"
import { resolveMercflowStoreId } from "../../../modules/inventory/resolve-store-id"
import type InventoryModuleService from "../../../modules/inventory/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const config = await service.getInventoryConfig(storeId)
  res.status(200).json({
    config: config ?? {
      store_id: storeId,
      low_stock_threshold: 5,
      email_alerts_enabled: false,
    },
  })
}

export const PATCH = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = inventoryConfigPatchBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(res, parsed.error)
    return
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const config = await service.upsertInventoryConfig(storeId, parsed.data)
  res.status(200).json({ config })
}
