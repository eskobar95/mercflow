export const EMAIL_DELIVERY_STATUSES = [
  "queued",
  "sent",
  "failed",
  "dead_letter",
] as const

export type EmailDeliveryStatus = (typeof EMAIL_DELIVERY_STATUSES)[number]

export type EmailDeliveryDto = {
  id: string
  store_id: string
  template_key: string
  to_email: string
  entity_id: string
  idempotency_key: string
  status: EmailDeliveryStatus
  error_message: string | null
  sent_at: string | null
  ses_message_id: string | null
  created_at: string
  updated_at: string
}

export type EmailDeliveriesListResult = {
  deliveries: EmailDeliveryDto[]
  count: number
  limit: number
  offset: number
}

export type ResendEmailDeliveryResult = {
  delivery: EmailDeliveryDto
  enqueued: boolean
}
