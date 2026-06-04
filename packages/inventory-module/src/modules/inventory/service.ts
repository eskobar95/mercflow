import type { Context } from "@medusajs/types"
import { MedusaService } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import type { CreateOrderNoteInput, MercflowOrderNoteRecord } from "./types"
import { MercflowOrderNote } from "./models/mercflow-order-note"
import { runWithTenantScope } from "./tenant-scope"

const NOTE_CONTENT_MAX = 4000

class InventoryModuleService extends MedusaService({
  MercflowOrderNote,
}) {
  async withTenant<T>(
    storeId: string,
    fn: (context: Context) => Promise<T>
  ): Promise<T> {
    const baseRepo = (
      this as unknown as {
        baseRepository_: Parameters<typeof runWithTenantScope>[0]
      }
    ).baseRepository_
    return runWithTenantScope(baseRepo, storeId, fn)
  }

  async listOrderNotes(
    storeId: string,
    orderId: string
  ): Promise<MercflowOrderNoteRecord[]> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowOrderNotes(
        {
          store_id: storeId,
          order_id: orderId,
        },
        { order: { created_at: "DESC" } },
        context
      )
      return rows.map((row) => this.toNoteRecord(row as MercflowOrderNoteRecord))
    })
  }

  async createOrderNote(
    storeId: string,
    orderId: string,
    input: CreateOrderNoteInput
  ): Promise<MercflowOrderNoteRecord> {
    const content = input.content.trim()
    if (content === "") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Note content is required")
    }
    if (content.length > NOTE_CONTENT_MAX) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Note content must not exceed ${NOTE_CONTENT_MAX} characters`
      )
    }
    const createdBy = (input.created_by ?? "admin").trim()
    if (createdBy === "") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "created_by is required")
    }

    return this.withTenant(storeId, async (context) => {
      const created = await this.createMercflowOrderNotes(
        {
          store_id: storeId,
          order_id: orderId,
          content,
          created_by: createdBy,
        },
        context
      )
      const row = Array.isArray(created) ? created[0] : created
      return this.toNoteRecord(row as MercflowOrderNoteRecord)
    })
  }

  async deleteOrderNote(
    storeId: string,
    orderId: string,
    noteId: string
  ): Promise<void> {
    await this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowOrderNotes(
        {
          id: noteId,
          store_id: storeId,
          order_id: orderId,
        },
        {},
        context
      )
      const existing = rows[0] as MercflowOrderNoteRecord | undefined
      if (!existing) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Order note "${noteId}" not found for order "${orderId}"`
        )
      }
      await this.softDeleteMercflowOrderNotes(existing.id)
    })
  }

  private toNoteRecord(row: MercflowOrderNoteRecord): MercflowOrderNoteRecord {
    return {
      id: row.id,
      store_id: row.store_id,
      order_id: row.order_id,
      content: row.content,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at ?? null,
    }
  }
}

export default InventoryModuleService
