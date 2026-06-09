export const METAFIELD_OWNER_TYPES = ["product", "category"] as const

export type MetafieldOwnerType = (typeof METAFIELD_OWNER_TYPES)[number]

export const METAFIELD_VALUE_TYPES = [
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

export type MetafieldValueType = (typeof METAFIELD_VALUE_TYPES)[number]

export type MetafieldDefinitionDto = {
  id: string
  store_id: string | null
  owner_type: MetafieldOwnerType
  namespace: string
  key: string
  name: string
  description: string | null
  type: MetafieldValueType
  validations: Record<string, unknown> | null
  pinned_position: number | null
  is_required: boolean
  is_primary: boolean
  category_constraint_id: string | null
  is_standard: boolean
  created_at: string
  updated_at: string
}

export type CreateMetafieldDefinitionPayload = {
  owner_type: MetafieldOwnerType
  namespace: string
  key: string
  name: string
  description?: string | null
  type: MetafieldValueType
  validations?: Record<string, unknown> | null
  pinned_position?: number | null
  is_required?: boolean
  is_primary?: boolean
  category_constraint_id?: string | null
}

export type UpdateMetafieldDefinitionPayload = {
  name?: string
  description?: string | null
  type?: MetafieldValueType
  validations?: Record<string, unknown> | null
  pinned_position?: number | null
  is_required?: boolean
  is_primary?: boolean
  category_constraint_id?: string | null
}

export type CustomDataEntityKey = "product" | "category" | "variant" | "order" | "customer"

export type CustomDataListTab = "all" | "by_category"
