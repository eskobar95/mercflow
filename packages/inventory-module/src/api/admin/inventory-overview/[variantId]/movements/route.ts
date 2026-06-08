import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../../../../http/admin-list-limit"
import { sendZodError } from "../../../../http/zod-error"
import { INVENTORY_MODULE } from "../../../../../modules/inventory"
import { adminListQuerySchema } from "../../../../../modules/inventory/http-schemas"
import { resolveMercflowStoreId } from "../../../../../modules/inventory/resolve-store-id"
import type InventoryModuleService from "../../../../../modules/inventory/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const variantId = req.params.variantId
  if (!variantId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing variant id")
  }

  const parsed = adminListQuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const limit = Math.min(resolveAdminListLimit(parsed.data.limit), 100)
  const offset = resolveAdminListOffset(parsed.data.offset)

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const { movements, count } = await service.listVariantMovements(storeId, variantId, {
    limit,
    offset,
  })

  res.status(200).json({
    variant_id: variantId,
    movements,
    count,
    limit,
    offset,
  })
}
