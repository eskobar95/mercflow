import type { ShipmentPackagingRecord } from "../../modules/packaging/types"

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value
}

export function shipmentPackagingToAdminJson(
  row: ShipmentPackagingRecord
): Record<string, unknown> {
  return {
    id: row.id,
    store_id: row.store_id,
    fulfillment_id: row.fulfillment_id,
    packaging_type_id: row.packaging_type_id,
    dimensions_snapshot_json: row.dimensions_snapshot_json,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
  }
}
