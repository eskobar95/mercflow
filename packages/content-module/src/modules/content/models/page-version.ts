import { model } from "@medusajs/framework/utils"

export const PageVersion = model.define("page_version", {
  id: model.id().primaryKey(),
  page_id: model.text().index("IDX_page_version_page_id"),
  version: model.number(),
  status: model.enum(["draft", "published"]).default("draft"),
  published_at: model.dateTime().nullable(),
})
