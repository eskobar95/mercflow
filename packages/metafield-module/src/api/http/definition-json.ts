import type { MetafieldDefinitionRecord } from "../../modules/metafield/types"

export type MetafieldDefinitionAdminJson = {
  id: string
  store_id: string | null
  owner_type: string
  namespace: string
  key: string
  name: string
  description: string | null
  type: string
  validations: Record<string, unknown> | null
  pinned_position: number | null
  is_required: boolean
  is_primary: boolean
  category_constraint_id: string | null
  is_standard: boolean
  created_at: string
  updated_at: string
}

export function definitionToAdminJson(
  row: MetafieldDefinitionRecord
): MetafieldDefinitionAdminJson {
  return {
    id: row.id,
    store_id: row.store_id,
    owner_type: row.owner_type,
    namespace: row.namespace,
    key: row.key,
    name: row.name,
    description: row.description,
    type: row.type,
    validations: row.validations,
    pinned_position: row.pinned_position,
    is_required: row.is_required,
    is_primary: row.is_primary,
    category_constraint_id: row.category_constraint_id,
    is_standard: row.is_standard,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }
}
