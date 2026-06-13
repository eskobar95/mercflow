import { model } from "@medusajs/framework/utils"

export const ConnectorConfig = model.define("connector_config", {
  id: model.id().primaryKey(),
  type: model.text(),
  credentials_encrypted: model.text(),
  active: model.boolean(),
  last_tested_at: model.dateTime().nullable(),
  connection_status: model.text().nullable(),
  last_test_message: model.text().nullable(),
  rules_json: model.json().nullable(),
})
