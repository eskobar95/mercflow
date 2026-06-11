import { model } from "@medusajs/framework/utils"

export const MercflowEmailConfig = model
  .define("email_configs", {
    id: model.id().primaryKey(),
    store_id: model.text(),
    domain: model.text().nullable(),
    from_email: model.text().nullable(),
    from_name: model.text().nullable(),
    reply_to: model.text().nullable(),
    logo_url: model.text().nullable(),
    brand_color: model.text().nullable(),
    support_email: model.text().nullable(),
    ses_domain_status: model.enum(["pending", "verified", "failed"]).default("pending"),
    ses_identity_arn: model.text().nullable(),
    fallback_from: model.text().nullable(),
    dns_records: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_email_configs_store_id",
      on: ["store_id"],
      unique: true,
    },
  ])
