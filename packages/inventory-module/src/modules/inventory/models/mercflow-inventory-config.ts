import { model } from "@medusajs/framework/utils"

export const MercflowInventoryConfig = model
  .define("mercflow_inventory_config", {
    id: model.id().primaryKey(),
    store_id: model.text().index("IDX_mercflow_inventory_config_store_id"),
    low_stock_threshold: model.number().default(5),
    email_alerts_enabled: model.boolean().default(false),
  })
  .indexes([
    {
      name: "IDX_mercflow_inventory_config_store_unique",
      on: ["store_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])
