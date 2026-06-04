import type { MercflowSupplierRecord } from "../../modules/inventory/types"

export function supplierToAdminJson(row: MercflowSupplierRecord): Record<string, unknown> {
  return {
    id: row.id,
    store_id: row.store_id,
    name: row.name,
    contact_person: row.contact_person,
    email: row.email,
    country: row.country,
    currency: row.currency,
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  }
}
