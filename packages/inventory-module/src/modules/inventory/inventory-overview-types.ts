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

export const INVENTORY_OVERVIEW_SORT_COLUMNS = [
  "title",
  "stocked",
  "reserved",
  "available",
  "incoming",
] as const

export type InventoryOverviewSortColumn =
  (typeof INVENTORY_OVERVIEW_SORT_COLUMNS)[number]

export type InventoryOverviewSortDirection = "asc" | "desc"

export type InventoryOverviewQuery = {
  page: number
  limit: number
  search: string
  filter: "all" | "low_stock"
  sort_by: InventoryOverviewSortColumn
  sort_dir: InventoryOverviewSortDirection
}
