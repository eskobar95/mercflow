import { model } from "@medusajs/framework/utils"

export const MercflowSitemapConfig = model.define("mercflow_sitemap_config", {
  id: model.id().primaryKey(),
  store_id: model.text().index("IDX_mercflow_sitemap_config_store_id"),
  page_type_settings: model.json().nullable(),
  excluded_product_ids: model.json().nullable(),
  excluded_category_ids: model.json().nullable(),
  excluded_page_ids: model.json().nullable(),
})
