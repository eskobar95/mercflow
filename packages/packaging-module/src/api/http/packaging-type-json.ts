import type { PackagingTypeRecord } from "../../modules/packaging/types"

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value
}

export function packagingTypeToAdminJson(
  row: PackagingTypeRecord
): Record<string, unknown> {
  return {
    id: row.id,
    store_id: row.store_id,
    name: row.name,
    type: row.type,
    length_mm: row.length_mm,
    width_mm: row.width_mm,
    height_mm: row.height_mm,
    max_weight_g: row.max_weight_g,
    is_active: row.is_active,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    deleted_at: row.deleted_at === null ? null : toIso(row.deleted_at),
  }
}
