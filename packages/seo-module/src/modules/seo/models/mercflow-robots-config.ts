import { model } from "@medusajs/framework/utils"

export const MercflowRobotsConfig = model.define("mercflow_robots_config", {
  id: model.id().primaryKey(),
  store_id: model.text().index("IDX_mercflow_robots_config_store_id"),
  structured_rules: model.json().nullable(),
  freetext_override: model.text().nullable(),
  change_history: model.json().nullable(),
})
