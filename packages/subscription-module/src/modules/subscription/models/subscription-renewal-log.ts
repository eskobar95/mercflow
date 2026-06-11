import { model } from "@medusajs/framework/utils"

export const MercflowSubscriptionRenewalLog = model
  .define("subscription_renewal_log", {
    id: model.id().primaryKey(),
    subscription_id: model.text().index("IDX_subscription_renewal_log_subscription_id"),
    order_id: model.text(),
    amount: model.bigNumber(),
    currency: model.text(),
    status: model.enum(["success", "failed", "skipped"]).default("success"),
    stripe_payment_intent_id: model.text().nullable(),
    error_message: model.text().nullable(),
  })
  .indexes([
    {
      name: "IDX_subscription_renewal_log_subscription_created",
      on: ["subscription_id", "created_at"],
    },
  ])
