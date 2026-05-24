import { model } from "@medusajs/framework/utils"

export const ConnectorConfig = model.define("connector_config", {
  id: model.id().primaryKey(),
  type: model.text(),
  credentials_encrypted: model.text(),
  active: model.boolean(),
  last_tested_at: model.dateTime().nullable(),
  /** How catalog prices relate to VAT (storefront/checkout integration consumes this flag). */
  vat_mode: model.text().default("inclusive"),
  /** Preview tail for masked admin UI — never stores raw secrets here. */
  secret_key_last4: model.text().nullable(),
  publishable_key_last4: model.text().nullable(),
  webhook_secret_last4: model.text().nullable(),
  /** Last outbound connectivity probe outcome: ok | error (null = no result stored yet). */
  connection_status: model.text().nullable(),
  /** Non-sensitive explanation for admins (errors are user-safe; never store API keys). */
  last_test_message: model.text().nullable(),
  /**
   * Connector-specific rules (non-secret). For Shipmondo: markup, free-shipping threshold, enabled carriers.
   */
  rules_json: model.json().nullable(),
})
