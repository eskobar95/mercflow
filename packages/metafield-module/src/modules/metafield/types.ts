export const METAFIELD_OWNER_TYPES = ["product", "category"] as const

export type MetafieldOwnerType = (typeof METAFIELD_OWNER_TYPES)[number]

export const VALUE_TYPES = [
  "single_line_text",
  "multi_line_text",
  "number_integer",
  "number_decimal",
  "boolean",
  "date",
  "date_time",
  "color",
  "url",
  "json",
  "list.single_line_text",
  "list.number_integer",
  "rich_text",
] as const

export type ValueType = (typeof VALUE_TYPES)[number]

export type MetafieldDefinitionRecord = {
  id: string
  store_id: string | null
  owner_type: MetafieldOwnerType
  namespace: string
  key: string
  name: string
  description: string | null
  type: ValueType
  validations: Record<string, unknown> | null
  pinned_position: number | null
  is_required: boolean
  is_primary: boolean
  category_constraint_id: string | null
  is_standard: boolean
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type MetafieldValueRecord = {
  id: string
  store_id: string
  definition_id: string
  owner_id: string
  owner_type: MetafieldOwnerType
  value_text: string | null
  value_json: Record<string, unknown> | null
  value_number: number | null
  value_boolean: boolean | null
  locale: string
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type CreateDefinitionInput = {
  owner_type: MetafieldOwnerType
  namespace: string
  key: string
  name: string
  description?: string | null
  type: ValueType
  validations?: Record<string, unknown> | null
  pinned_position?: number | null
  is_required?: boolean
  is_primary?: boolean
  category_constraint_id?: string | null
}

export type UpdateDefinitionInput = {
  name?: string
  description?: string | null
  type?: ValueType
  validations?: Record<string, unknown> | null
  pinned_position?: number | null
  is_required?: boolean
  is_primary?: boolean
  category_constraint_id?: string | null
}

export type ListDefinitionsFilters = {
  ownerType: MetafieldOwnerType
  storeId: string
  categoryConstraintId?: string
  limit?: number
  offset?: number
}

export type ListStandardLibraryFilters = {
  vertical: string
  storeId: string
  ownerType?: MetafieldOwnerType
  limit?: number
  offset?: number
}

export type ActivateStandardDefinitionsInput = {
  vertical: string
  definitionIds?: string[]
}

export type ActivateStandardDefinitionsResult = {
  activated: MetafieldDefinitionRecord[]
  skipped_keys: string[]
}

export type UpsertValueInput = {
  definition_id: string
  owner_id: string
  owner_type: MetafieldOwnerType
  locale?: string
  value: unknown
}

export type MetafieldValueListItem = {
  id: string
  namespace: string
  key: string
  name: string
  type: ValueType
  value: unknown
  locale: string
}

export type StoredValueColumns = {
  value_text: string | null
  value_json: Record<string, unknown> | unknown[] | null
  value_number: number | null
  value_boolean: boolean | null
}
