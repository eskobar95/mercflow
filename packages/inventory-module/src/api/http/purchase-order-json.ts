import type {
  MercflowPurchaseOrderLineRecord,
  MercflowPurchaseOrderReceiptRecord,
  MercflowPurchaseOrderRecord,
  PurchaseOrderLineSummary,
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

export function purchaseOrderLineSummaryToAdminJson(
  row: PurchaseOrderLineSummary
): Record<string, unknown> {
  return {
    ...purchaseOrderLineToAdminJson(row),
    received_total: row.received_total,
    discrepancy: row.discrepancy,
  }
}

export function purchaseOrderReceiptToAdminJson(
  row: MercflowPurchaseOrderReceiptRecord
): Record<string, unknown> {
  const receivedAt =
    row.received_at instanceof Date ? row.received_at.toISOString() : row.received_at
  return {
    id: row.id,
    store_id: row.store_id,
    line_id: row.line_id,
    received_qty: row.received_qty,
    received_at: receivedAt,
    notes: row.notes,
  }
}

export function purchaseOrderDetailToAdminJson(detail: {
  purchase_order: MercflowPurchaseOrderRecord
  lines: PurchaseOrderLineSummary[]
  stock_applied: false
}): Record<string, unknown> {
  return {
    purchase_order: purchaseOrderToAdminJson(detail.purchase_order),
    lines: detail.lines.map((line) => purchaseOrderLineSummaryToAdminJson(line)),
    stock_applied: detail.stock_applied,
  }
}
