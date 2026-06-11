import { model } from "@medusajs/framework/utils"

export const MercflowSubscriptionConfig = model
  .define("subscription_config", {
    id: model.id().primaryKey(),
    store_id: model.text().index("IDX_subscription_config_store_id"),
    club_enabled: model.boolean().default(false),
    club_stripe_product_id: model.text().nullable(),
    club_price_monthly: model.bigNumber().nullable(),
    club_price_annual: model.bigNumber().nullable(),
    club_fallback_discount_pct: model.bigNumber().nullable(),
    club_name: model.text().nullable(),
  })
  .indexes([
    {
      name: "IDX_subscription_config_store_unique",
      on: ["store_id"],
      unique: true,
    },
  ])
