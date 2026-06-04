import type { MercflowOrderNoteRecord } from "../../modules/inventory/types"

export function orderNoteToAdminJson(row: MercflowOrderNoteRecord): {
  id: string
  order_id: string
  store_id: string
  content: string
  created_by: string
  created_at: string
} {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at)
  return {
    id: row.id,
    order_id: row.order_id,
    store_id: row.store_id,
    content: row.content,
    created_by: row.created_by,
    created_at: createdAt,
  }
}
