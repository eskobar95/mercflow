import { model } from "@medusajs/framework/utils"

export const ProductContent = model.define("product_content", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  description_rich: model.json().nullable(),
  seo_title: model.text().nullable(),
  seo_description: model.text().nullable(),
  seo_og_image_id: model.text().nullable(),
  media_gallery: model.array().nullable(),
})
