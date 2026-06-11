import { model } from "@medusajs/framework/utils"

export const MercflowSubscription = model
  .define("subscription", {
    id: model.id().primaryKey(),
    store_id: model.text().index("IDX_subscription_store_id"),
    customer_id: model.text().index("IDX_subscription_customer_id"),
    product_id: model.text(),
    variant_id: model.text(),
    interval: model
      .enum(["weekly", "biweekly", "monthly", "quarterly"])
      .default("monthly"),
    status: model
      .enum(["active", "paused", "cancelled", "past_due", "pending_payment"])
      .default("active"),
    stripe_subscription_id: model.text().nullable(),
    current_period_start: model.dateTime(),
    current_period_end: model.dateTime(),
    next_renewal_at: model.dateTime(),
    cancelled_at: model.dateTime().nullable(),
    pause_requested_at: model.dateTime().nullable(),
  })
  .indexes([
    {
      name: "IDX_subscription_store_status",
      on: ["store_id", "status"],
    },
    {
      name: "IDX_subscription_store_customer",
      on: ["store_id", "customer_id"],
    },
  ])
