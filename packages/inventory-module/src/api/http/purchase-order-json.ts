import type {
  MercflowPurchaseOrderLineRecord,
  MercflowPurchaseOrderRecord,
} from "../../modules/inventory/types"

export function purchaseOrderToAdminJson(
  row: MercflowPurchaseOrderRecord
): Record<string, unknown> {
  const expected =
    row.expected_date === null || row.expected_date === undefined
      ? null
      : row.expected_date instanceof Date
        ? row.expected_date.toISOString()
        : row.expected_date

  return {
    id: row.id,
    store_id: row.store_id,
    supplier_id: row.supplier_id,
    status: row.status,
    expected_date: expected,
    reference: row.reference,
    notes: row.notes,
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  }
}

export function purchaseOrderLineToAdminJson(
  row: MercflowPurchaseOrderLineRecord
): Record<string, unknown> {
  return {
    id: row.id,
    store_id: row.store_id,
    po_id: row.po_id,
    variant_id: row.variant_id,
    ordered_qty: row.ordered_qty,
    unit_cost: row.unit_cost,
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  }
}
