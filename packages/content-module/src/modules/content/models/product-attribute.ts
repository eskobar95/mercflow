import { model } from "@medusajs/framework/utils"

export const ProductAttribute = model
  .define("product_attribute", {
    id: model.id().primaryKey(),
    store_id: model.text().index("IDX_product_attribute_store_id"),
    handle: model.text(),
    label: model.text(),
    value_type: model.enum(["text", "number", "boolean"]).default("text"),
  })
  .indexes([
    {
      name: "IDX_product_attribute_handle_store_unique",
      on: ["handle", "store_id"],
      unique: true,
    },
  ])
