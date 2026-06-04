import { model } from "@medusajs/framework/utils"

/**
 * Partial unique on (slug, locale, store_id) where deleted_at IS NULL is defined in
 * Migration20260604120000AddStoreIdTenancy (DML cannot express partial indexes).
 */
export const Page = model.define("page", {
  id: model.id().primaryKey(),
  store_id: model.text().index("IDX_page_store_id"),
  slug: model.text(),
  title: model.text(),
  page_type: model.enum(["homepage", "landing", "content"]),
  status: model.enum(["draft", "published"]).default("draft"),
  locale: model.text(),
})
