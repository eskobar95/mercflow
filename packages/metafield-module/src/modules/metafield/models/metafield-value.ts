import { model } from "@medusajs/framework/utils"

export const MetafieldValue = model.define("metafield_values", {
  id: model.id().primaryKey(),
  store_id: model.text().index("IDX_metafield_values_store_id"),
  definition_id: model.text().index("IDX_metafield_values_definition_id"),
  owner_id: model.text().index("IDX_metafield_values_owner_id"),
  owner_type: model.text(),
  value_text: model.text().nullable(),
  value_json: model.json().nullable(),
  value_number: model.number().nullable(),
  value_boolean: model.boolean().nullable(),
  locale: model.text().default("en"),
})
