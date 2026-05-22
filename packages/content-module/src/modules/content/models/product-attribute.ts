import { model } from "@medusajs/framework/utils"

/** Lightweight attribute definitions keyed by immutable handle/slug. */
export const ProductAttribute = model.define("product_attribute", {
  id: model.id().primaryKey(),
  handle: model.text().unique("IDX_product_attribute_handle_unique"),
  label: model.text(),
  value_type: model.enum(["text", "number", "boolean"]).default("text"),
})
