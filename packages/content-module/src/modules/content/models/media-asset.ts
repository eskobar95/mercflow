import { model } from "@medusajs/framework/utils"

export const MediaAsset = model.define("media_asset", {
  id: model.id().primaryKey(),
  store_id: model.text().index("IDX_media_asset_store_id"),
  url: model.text(),
  alt: model.text().nullable(),
  mime_type: model.text().nullable(),
  width: model.number().nullable(),
  height: model.number().nullable(),
})
