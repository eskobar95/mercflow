import { model } from "@medusajs/framework/utils"

/**
 * Key/value global CMS settings (single-tenant defaults use `scope = "default"`).
 */
export const CmsGlobal = model
  .define("cms_global", {
    id: model.id().primaryKey(),
    scope: model.text(),
    data_json: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_cms_global_scope_unique",
      on: ["scope"],
      unique: true,
    },
  ])
