export const SES_DOMAIN_STATUSES = ["pending", "verified", "failed"] as const
export type SesDomainStatus = (typeof SES_DOMAIN_STATUSES)[number]

export const EMAIL_DELIVERY_STATUSES = [
  "queued",
  "sent",
  "failed",
  "dead_letter",
] as const
export type EmailDeliveryStatus = (typeof EMAIL_DELIVERY_STATUSES)[number]

export type DkimCnameRecord = {
  type: "CNAME"
  name: string
  value: string
}

export type SpfTxtRecord = {
  type: "TXT"
  name: string
  value: string
}

export type DomainDnsRecords = {
  dkim: DkimCnameRecord[]
  spf: SpfTxtRecord
}

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
  dns_records: DomainDnsRecords | null
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}

export type SetupDomainResult = {
  domain: string
  records: DomainDnsRecords
  ses_domain_status: SesDomainStatus
  fallback_from: string
}

export type DomainStatusResult = {
  status: SesDomainStatus
  records: DomainDnsRecords | null
  fallback_from: string
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

export const NOTIFICATION_QUEUE_NAME = "mercflow-notifications"
export const NOTIFICATION_DLQ_NAME = "mercflow-notifications-dead"
export const SEND_EMAIL_JOB_NAME = "send-email"
export const CHECK_PENDING_DOMAINS_JOB_NAME = "check-pending-domains"
export const DOMAIN_STATUS_POLL_INTERVAL_MS = 15 * 60 * 1000
export const DOMAIN_STATUS_POLL_SCHEDULER_ID = "notification-domain-status-poll"

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

export const DEFAULT_FALLBACK_FROM = "noreply@mail.mercflow.shop"
