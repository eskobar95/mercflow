import { model } from "@medusajs/framework/utils"

export const CategoryContent = model.define("category_content", {
  id: model.id().primaryKey(),
  category_id: model.text(),
  description_rich: model.json().nullable(),
  seo_title: model.text().nullable(),
  seo_description: model.text().nullable(),
  seo_og_image_id: model.text().nullable(),
  banner_image_id: model.text().nullable(),
})
