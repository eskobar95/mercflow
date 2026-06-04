import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../../../http/zod-error"
import { orderNoteToAdminJson } from "../../../../http/order-note-json"
import { INVENTORY_MODULE } from "../../../../../modules/inventory"
import { orderNotePostBodySchema } from "../../../../../modules/inventory/http-schemas"
import { resolveMercflowStoreId } from "../../../../../modules/inventory/resolve-store-id"
import type InventoryModuleService from "../../../../../modules/inventory/service"

function readOrderId(req: MedusaRequest): string | null {
  const raw = req.params?.id
  return typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null
}

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const orderId = readOrderId(req)
  if (orderId === null) {
    res.status(400).json({ message: "order id is required" })
    return
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const notes = await service.listOrderNotes(storeId, orderId)
  res.status(200).json({
    notes: notes.map((n) => orderNoteToAdminJson(n)),
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const orderId = readOrderId(req)
  if (orderId === null) {
    res.status(400).json({ message: "order id is required" })
    return
  }

  const parsed = orderNotePostBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(res, parsed.error)
    return
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const row = await service.createOrderNote(storeId, orderId, {
    content: parsed.data.content,
    created_by: parsed.data.created_by,
  })
  res.status(201).json({ note: orderNoteToAdminJson(row) })
}
