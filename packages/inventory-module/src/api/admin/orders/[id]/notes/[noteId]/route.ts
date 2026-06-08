import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { INVENTORY_MODULE } from "../../../../../../modules/inventory"
import { resolveMercflowStoreId } from "../../../../../../modules/inventory/resolve-store-id"
import type InventoryModuleService from "../../../../../../modules/inventory/service"

function readOrderId(req: MedusaRequest): string | null {
  const raw = req.params?.id
  return typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null
}

function readNoteId(req: MedusaRequest): string | null {
  const raw = req.params?.noteId
  return typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const orderId = readOrderId(req)
  const noteId = readNoteId(req)
  if (orderId === null || noteId === null) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "order id and note id are required"
    )
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  await service.deleteOrderNote(storeId, orderId, noteId)
  res.status(200).json({ deleted: true, id: noteId })
}
