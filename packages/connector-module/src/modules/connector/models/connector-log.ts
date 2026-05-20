import { model } from "@medusajs/framework/utils"

/**
 * Audit / event log for connector activity. FK to connector_config via connector_id.
 */
export const ConnectorLog = model.define("connector_log", {
  id: model.id().primaryKey(),
  connector_id: model.text(),
  event: model.text(),
  payload_json: model.json().nullable(),
})
