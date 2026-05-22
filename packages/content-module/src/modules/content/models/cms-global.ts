import { model } from "@medusajs/framework/utils"

/** Keyed global JSON blobs (homepage globals, Payload-style scope keys). */
export const CmsGlobal = model.define("cms_global", {
  id: model.id().primaryKey(),
  scope: model.text().unique("IDX_cms_global_scope_unique"),
  data_json: model.json().nullable(),
})
