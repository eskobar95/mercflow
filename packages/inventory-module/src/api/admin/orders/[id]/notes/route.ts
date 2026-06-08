import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../../../../http/admin-list-limit"
import { sendZodError } from "../../../../http/zod-error"
import { orderNoteToAdminJson } from "../../../../http/order-note-json"
import { INVENTORY_MODULE } from "../../../../../modules/inventory"
import {
  adminListQuerySchema,
  orderNotePostBodySchema,
} from "../../../../../modules/inventory/http-schemas"
import { resolveMercflowStoreId } from "../../../../../modules/inventory/resolve-store-id"
import type InventoryModuleService from "../../../../../modules/inventory/service"

function readOrderId(req: MedusaRequest): string | null {
  const raw = req.params?.id
  return typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null
}

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const orderId = readOrderId(req)
  if (orderId === null) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "order id is required")
  }

  const parsed = adminListQuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const limit = Math.min(resolveAdminListLimit(parsed.data.limit), 100)
  const offset = resolveAdminListOffset(parsed.data.offset)

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const { notes, count } = await service.listOrderNotes(storeId, orderId, { limit, offset })
  res.status(200).json({
    notes: notes.map((n) => orderNoteToAdminJson(n)),
    count,
    limit,
    offset,
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const orderId = readOrderId(req)
  if (orderId === null) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "order id is required")
  }

  const parsed = orderNotePostBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(INVENTORY_MODULE) as unknown as InventoryModuleService
  const row = await service.createOrderNote(storeId, orderId, {
    content: parsed.data.content,
    created_by: parsed.data.created_by,
  })
  res.status(201).json({ note: orderNoteToAdminJson(row) })
}
