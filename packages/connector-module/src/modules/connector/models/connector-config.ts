import { model } from "@medusajs/framework/utils"

/**
 * Connector integration type values stored as enum/check in PostgreSQL.
 */
export const ConnectorTypeEnum = {
  SHIPMONDO: "shipmondo",
  STRIPE: "stripe",
  PLUNK: "plunk",
  GTM: "gtm",
} as const

export const ConnectorConfig = model.define("connector_config", {
  id: model.id().primaryKey(),
  type: model.enum(ConnectorTypeEnum).unique(),
  credentials_encrypted: model.text(),
  active: model.boolean().default(true),
})
