export const SES_DOMAIN_STATUSES = ["pending", "verified", "failed"] as const
export type SesDomainStatus = (typeof SES_DOMAIN_STATUSES)[number]

export const EMAIL_DELIVERY_STATUSES = [
  "queued",
  "sent",
  "failed",
  "dead_letter",
] as const
export type EmailDeliveryStatus = (typeof EMAIL_DELIVERY_STATUSES)[number]

export type EmailConfigRecord = {
  id: string
  store_id: string
  domain: string | null
  from_email: string | null
  from_name: string | null
  reply_to: string | null
  logo_url: string | null
  brand_color: string | null
  support_email: string | null
  ses_domain_status: SesDomainStatus
  ses_identity_arn: string | null
  fallback_from: string | null
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}

export type EmailDeliveryRecord = {
  id: string
  store_id: string
  template_key: string
  to_email: string
  entity_id: string
  idempotency_key: string
  status: EmailDeliveryStatus
  error_message: string | null
  sent_at: string | Date | null
  ses_message_id: string | null
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}

export type UpdateEmailConfigBrandingInput = {
  logo_url?: string | null
  brand_color?: string | null
  from_name?: string | null
  reply_to?: string | null
  support_email?: string | null
}

export type EnqueueEmailInput = {
  storeId: string
  templateKey: string
  to: string
  entityId: string
  data: Record<string, unknown>
}

export type EnqueueEmailResult = {
  delivery: EmailDeliveryRecord
  enqueued: boolean
}

export type SendEmailJobPayload = {
  storeId: string
  templateKey: string
  to: string
  entityId: string
  data: Record<string, unknown>
  deliveryId: string
}

export const NOTIFICATION_MODULE = "notification"

export const NOTIFICATION_QUEUE_NAME = "mercflow:notifications"
export const NOTIFICATION_DLQ_NAME = "mercflow:notifications:dead"
export const SEND_EMAIL_JOB_NAME = "send-email"

export const NOTIFICATION_JOB_RETRY_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 30_000,
  },
}

export type TemplateKey = string

export type TemplateProps = Record<string, unknown> & {
  logoUrl?: string | null
  brandColor?: string | null
  fromName?: string | null
  replyTo?: string | null
  supportEmail?: string | null
}

export const DEFAULT_FALLBACK_FROM = "noreply@mail.mercflow.com"
