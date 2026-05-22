import { model } from "@medusajs/framework/utils"

/** URL redirect rules (additive CMS table — no edits to core Medusa schema). */
export const CmsRedirect = model.define("cms_redirect", {
  id: model.id().primaryKey(),
  from_path: model.text().index("IDX_cms_redirect_from_path"),
  to_path: model.text(),
})
