import { model } from "@medusajs/framework/utils"

export const MercflowEmailDelivery = model
  .define("email_deliveries", {
    id: model.id().primaryKey(),
    store_id: model.text(),
    template_key: model.text(),
    to_email: model.text(),
    entity_id: model.text(),
    idempotency_key: model.text(),
    status: model.enum(["queued", "sent", "failed", "dead_letter"]).default("queued"),
    error_message: model.text().nullable(),
    sent_at: model.dateTime().nullable(),
    ses_message_id: model.text().nullable(),
  })
  .indexes([
    {
      name: "IDX_email_deliveries_store_id",
      on: ["store_id"],
    },
    {
      name: "IDX_email_deliveries_idempotency_key",
      on: ["idempotency_key"],
      unique: true,
    },
  ])
