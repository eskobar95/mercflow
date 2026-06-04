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
