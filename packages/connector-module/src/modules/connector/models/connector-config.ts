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
})
