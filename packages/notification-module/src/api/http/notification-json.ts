import type { EmailConfigRecord, EmailDeliveryRecord } from "../../modules/notification/types"

export function emailConfigToAdminJson(config: EmailConfigRecord): Record<string, unknown> {
  return {
    id: config.id,
    store_id: config.store_id,
    domain: config.domain,
    from_email: config.from_email,
    from_name: config.from_name,
    reply_to: config.reply_to,
    logo_url: config.logo_url,
    brand_color: config.brand_color,
    support_email: config.support_email,
    ses_domain_status: config.ses_domain_status,
    ses_identity_arn: config.ses_identity_arn,
    fallback_from: config.fallback_from,
    dns_records: config.dns_records,
    created_at: config.created_at,
    updated_at: config.updated_at,
  }
}

export function emailDeliveryToAdminJson(delivery: EmailDeliveryRecord): Record<string, unknown> {
  return {
    id: delivery.id,
    store_id: delivery.store_id,
    template_key: delivery.template_key,
    to_email: delivery.to_email,
    entity_id: delivery.entity_id,
    idempotency_key: delivery.idempotency_key,
    status: delivery.status,
    error_message: delivery.error_message,
    sent_at: delivery.sent_at,
    ses_message_id: delivery.ses_message_id,
    created_at: delivery.created_at,
    updated_at: delivery.updated_at,
  }
}
