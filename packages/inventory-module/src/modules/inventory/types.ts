export type CreateOrderNoteInput = {
  content: string
  created_by?: string
}

export type MercflowOrderNoteRecord = {
  id: string
  store_id: string
  order_id: string
  content: string
  created_by: string
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}

export type PickListLineRow = {
  order_id: string
  display_id: string
  line_item_id: string
  title: string
  variant_label: string
  quantity: number
  sku: string | null
}

export type PickListOrderGroup = {
  order_id: string
  display_id: string
  customer_name: string
  shipping_city: string | null
  lines: PickListLineRow[]
}

export const PURCHASE_ORDER_STATUSES = [
  "draft",
  "ordered",
  "partially_received",
  "received",
  "cancelled",
] as const

export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number]

export type MercflowSupplierRecord = {
  id: string
  store_id: string
  name: string
  contact_person: string | null
  email: string | null
  country: string | null
  currency: string | null
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}

export type CreateSupplierInput = {
  name: string
  contact_person?: string | null
  email?: string | null
  country?: string | null
  currency?: string | null
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>

export type MercflowPurchaseOrderLineRecord = {
  id: string
  store_id: string
  po_id: string
  variant_id: string
  ordered_qty: number
  unit_cost: number
  created_at: string | Date
  updated_at: string | Date
}

export type MercflowPurchaseOrderRecord = {
  id: string
  store_id: string
  supplier_id: string
  status: PurchaseOrderStatus
  expected_date: string | Date | null
  reference: string | null
  notes: string | null
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}

export type PurchaseOrderLineInput = {
  variant_id: string
  ordered_qty: number
  unit_cost: number
}

export type CreatePurchaseOrderInput = {
  supplier_id: string
  expected_date?: string | null
  reference?: string | null
  notes?: string | null
  lines: PurchaseOrderLineInput[]
}

export type MercflowInventoryConfigRecord = {
  id: string
  store_id: string
  low_stock_threshold: number
  email_alerts_enabled: boolean
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}
