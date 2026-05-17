import { model } from "@medusajs/framework/utils"

export const MediaAsset = model.define("media_asset", {
  id: model.id().primaryKey(),
  url: model.text(),
  alt: model.text().nullable(),
  mime_type: model.text().nullable(),
  width: model.number().nullable(),
  height: model.number().nullable(),
})
