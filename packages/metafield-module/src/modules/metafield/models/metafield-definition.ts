import { model } from "@medusajs/framework/utils"

export const MetafieldDefinition = model
  .define("metafield_definitions", {
    id: model.id().primaryKey(),
    store_id: model.text().nullable(),
    owner_type: model.text(),
    namespace: model.text(),
    key: model.text(),
    name: model.text(),
    description: model.text().nullable(),
    type: model.text(),
    validations: model.json().nullable(),
    pinned_position: model.number().nullable(),
    is_required: model.boolean().default(false),
    is_primary: model.boolean().default(false),
    category_constraint_id: model.text().nullable(),
    is_standard: model.boolean().default(false),
  })
  .indexes([
    {
      name: "IDX_metafield_definitions_store_id",
      on: ["store_id"],
    },
    {
      name: "IDX_metafield_definitions_store_owner_ns_key",
      on: ["store_id", "owner_type", "namespace", "key"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])
