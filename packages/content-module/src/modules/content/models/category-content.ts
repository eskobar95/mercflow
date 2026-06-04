import { model } from "@medusajs/framework/utils"

export const CategoryContent = model
  .define("category_content", {
    id: model.id().primaryKey(),
    store_id: model.text().index("IDX_category_content_store_id"),
    category_id: model.text().index("IDX_category_content_category_id"),
    locale: model.text(),
    body_json: model.json().nullable(),
    seo_title: model.text().nullable(),
    seo_description: model.text().nullable(),
    og_image_url: model.text().nullable(),
    banner_image_url: model.text().nullable(),
    canonical_url_override: model.text().nullable(),
    status: model.enum(["draft", "published"]).default("draft"),
    version: model.number().default(1),
  })
  .indexes([
    {
      name: "IDX_category_content_category_locale_store_unique",
      on: ["category_id", "locale", "store_id"],
      unique: true,
    },
  ])
