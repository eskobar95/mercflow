import { model } from "@medusajs/framework/utils"

/**
 * Key/value global CMS settings (single-tenant defaults use `scope = "default"`).
 */
export const CmsGlobal = model
  .define("cms_global", {
    id: model.id().primaryKey(),
    store_id: model.text().index("IDX_cms_global_store_id"),
    scope: model.text(),
    data_json: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_cms_global_scope_store_unique",
      on: ["scope", "store_id"],
      unique: true,
    },
  ])
