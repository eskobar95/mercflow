export type SupplierDto = {
  id: string
  store_id: string
  name: string
  contact_person: string | null
  email: string | null
  country: string | null
  currency: string | null
  created_at: string
  updated_at: string
}

export type SupplierInput = {
  name: string
  contact_person?: string | null
  email?: string | null
  country?: string | null
  currency?: string | null
}

export type PurchaseOrderLineDto = {
  id: string
  store_id: string
  po_id: string
  variant_id: string
  ordered_qty: number
  unit_cost: number
  created_at: string
  updated_at: string
}

export type PurchaseOrderDto = {
  id: string
  store_id: string
  supplier_id: string
  status: string
  expected_date: string | null
  reference: string | null
  notes: string | null
  created_at: string
  updated_at: string
  lines?: PurchaseOrderLineDto[]
}

export type CreatePurchaseOrderInput = {
  supplier_id: string
  expected_date?: string | null
  reference?: string | null
  notes?: string | null
  lines: Array<{
    variant_id: string
    ordered_qty: number
    unit_cost: number
  }>
}
