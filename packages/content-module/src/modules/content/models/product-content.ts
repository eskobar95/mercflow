import { model } from "@medusajs/framework/utils"

export const ProductContent = model
  .define("product_content", {
    id: model.id().primaryKey(),
    product_id: model.text().index("IDX_product_content_product_id"),
    locale: model.text(),
    body_json: model.json().nullable(),
    seo_title: model.text().nullable(),
    seo_description: model.text().nullable(),
    og_image_url: model.text().nullable(),
    status: model.enum(["draft", "published"]).default("draft"),
    version: model.number().default(1),
  })
  .indexes([
    {
      name: "IDX_product_content_product_locale_unique",
      on: ["product_id", "locale"],
      unique: true,
    },
  ])
