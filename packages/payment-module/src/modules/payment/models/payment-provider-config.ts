import { model } from "@medusajs/framework/utils"

export const MercflowPaymentProviderConfig = model
  .define("payment_provider_config", {
    id: model.id().primaryKey(),
    store_id: model.text().index("IDX_payment_provider_config_store_id"),
    provider: model.enum(["stripe", "mobilepay", "klarna"]),
    test_secret_key: model.text().nullable(),
    test_publishable_key: model.text().nullable(),
    test_webhook_secret: model.text().nullable(),
    live_secret_key: model.text().nullable(),
    live_publishable_key: model.text().nullable(),
    live_webhook_secret: model.text().nullable(),
    mode: model.enum(["test", "live"]).default("test"),
  })
  .indexes([
    {
      name: "IDX_payment_provider_config_store_provider_unique",
      on: ["store_id", "provider"],
      unique: true,
    },
  ])
