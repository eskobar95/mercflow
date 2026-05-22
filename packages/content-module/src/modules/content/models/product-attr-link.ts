import { model } from "@medusajs/framework/utils"

/** Simple product ↔ attribute value rows (text only in v1 schema). */
export const ProductAttrLink = model
  .define("product_attr_link", {
    id: model.id().primaryKey(),
    product_id: model.text().index("IDX_product_attr_link_product_id"),
    attribute_id: model.text().index("IDX_product_attr_link_attribute_id"),
    value_text: model.text().nullable(),
  })
  .indexes([
    {
      name: "IDX_product_attr_link_product_attribute_unique",
      on: ["product_id", "attribute_id"],
      unique: true,
    },
  ])
