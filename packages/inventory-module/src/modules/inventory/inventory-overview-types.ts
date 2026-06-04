export type InventoryOverviewRow = {
  variant_id: string
  sku: string | null
  title: string
  stocked: number
  reserved: number
  available: number
  incoming: number
  is_low_stock: boolean
}

export type InventoryMovementRow = {
  id: string
  occurred_at: string
  quantity: number
  source: "po_receipt" | "sale" | "manual_adjustment"
  label: string
}

export type InventoryOverviewQuery = {
  page: number
  limit: number
  search: string
  filter: "all" | "low_stock"
}
