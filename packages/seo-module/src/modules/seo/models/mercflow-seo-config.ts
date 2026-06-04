import { model } from "@medusajs/framework/utils"

export const MercflowSeoConfig = model
  .define("mercflow_seo_config", {
    id: model.id().primaryKey(),
    store_id: model.text().index("IDX_mercflow_seo_config_store_id"),
    storefront_url: model.text().nullable(),
    slug_strategy: model.text().default("nordic"),
    org_name: model.text().nullable(),
    org_logo_url: model.text().nullable(),
    org_social_urls: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_mercflow_seo_config_store_unique",
      on: ["store_id"],
      unique: true,
    },
  ])
