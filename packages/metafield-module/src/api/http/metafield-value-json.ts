import type { MetafieldValueListItem, MetafieldValueRecord } from "../../modules/metafield/types"

export function metafieldValueListItemToAdminJson(item: MetafieldValueListItem): MetafieldValueListItem {
  return item
}

export function metafieldValueRecordToAdminJson(row: MetafieldValueRecord): {
  id: string
  definition_id: string
  owner_id: string
  owner_type: string
  locale: string
  value_text: string | null
  value_json: unknown | null
  value_number: number | null
  value_boolean: boolean | null
} {
  return {
    id: row.id,
    definition_id: row.definition_id,
    owner_id: row.owner_id,
    owner_type: row.owner_type,
    locale: row.locale,
    value_text: row.value_text,
    value_json: row.value_json,
    value_number: row.value_number === null ? null : Number(row.value_number),
    value_boolean: row.value_boolean,
  }
}
