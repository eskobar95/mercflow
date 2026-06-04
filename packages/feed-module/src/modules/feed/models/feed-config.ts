import { model } from "@medusajs/framework/utils"

export const MercflowFeedConfig = model
  .define("mercflow_feed_config", {
    id: model.id().primaryKey(),
    store_id: model.text().index("IDX_mercflow_feed_config_store_id"),
    storefront_url: model.text().nullable(),
    excluded_product_ids: model.json().nullable(),
    excluded_category_ids: model.json().nullable(),
    default_condition: model.text().default("new"),
  })
  .indexes([
    {
      name: "IDX_mercflow_feed_config_store_unique",
      on: ["store_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])
