import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import {
  EMAIL_DELIVERY_STATUSES,
  type EmailDeliveriesListResult,
  type EmailDeliveryDto,
  type EmailDeliveryStatus,
  type ResendEmailDeliveryResult,
} from "./emailDeliveryTypes"

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function isEmailDeliveryStatus(value: string): value is EmailDeliveryStatus {
  return (EMAIL_DELIVERY_STATUSES as readonly string[]).includes(value)
}

function parseEmailDeliveryDto(raw: unknown): EmailDeliveryDto | null {
  if (!isRecord(raw)) {
    return null
  }
  const id = raw.id
  const storeId = raw.store_id
  const templateKey = raw.template_key
  const toEmail = raw.to_email
  const entityId = raw.entity_id
  const idempotencyKey = raw.idempotency_key
  const status = raw.status
  const errorMessage = raw.error_message
  const sentAt = raw.sent_at
  const sesMessageId = raw.ses_message_id
  const createdAt = raw.created_at
  const updatedAt = raw.updated_at
  if (
    typeof id !== "string" ||
    typeof storeId !== "string" ||
    typeof templateKey !== "string" ||
    typeof toEmail !== "string" ||
    typeof entityId !== "string" ||
    typeof idempotencyKey !== "string" ||
    typeof status !== "string" ||
    !isEmailDeliveryStatus(status) ||
    typeof createdAt !== "string" ||
    typeof updatedAt !== "string"
  ) {
    return null
  }
  return {
    id,
    store_id: storeId,
    template_key: templateKey,
    to_email: toEmail,
    entity_id: entityId,
    idempotency_key: idempotencyKey,
    status,
    error_message: errorMessage === null || typeof errorMessage === "string" ? errorMessage : null,
    sent_at: sentAt === null || typeof sentAt === "string" ? sentAt : null,
    ses_message_id:
      sesMessageId === null || typeof sesMessageId === "string" ? sesMessageId : null,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

function requireBackendBase(): string {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000).",
    )
  }
  return base
}

export async function fetchEmailDeliveriesAdmin(options: {
  limit: number
  offset: number
}): Promise<EmailDeliveriesListResult> {
  const base = requireBackendBase()
  const params = new URLSearchParams({
    limit: String(options.limit),
    offset: String(options.offset),
  })
  const response = await fetch(`${base}/admin/email-deliveries?${params.toString()}`, {
    method: "GET",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const body = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(body) || !Array.isArray(body.email_deliveries)) {
    throw new TypeError("Invalid email deliveries list response")
  }
  const count = body.count
  const limit = body.limit
  const offset = body.offset
  if (typeof count !== "number" || typeof limit !== "number" || typeof offset !== "number") {
    throw new TypeError("Invalid email deliveries list response: missing pagination")
  }
  const deliveries: EmailDeliveryDto[] = []
  for (const item of body.email_deliveries) {
    const parsed = parseEmailDeliveryDto(item)
    if (parsed !== null) {
      deliveries.push(parsed)
    }
  }
  return { deliveries, count, limit, offset }
}

export async function resendEmailDeliveryAdmin(deliveryId: string): Promise<ResendEmailDeliveryResult> {
  const base = requireBackendBase()
  const response = await fetch(
    `${base}/admin/email-deliveries/${encodeURIComponent(deliveryId)}/resend`,
    {
      method: "POST",
      credentials: "include",
      headers: buildMedusaAdminJsonHeaders(),
      body: JSON.stringify({}),
    },
  )
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const body = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(body)) {
    throw new TypeError("Invalid resend email delivery response")
  }
  const enqueued = body.enqueued
  const delivery = parseEmailDeliveryDto(body.email_delivery)
  if (typeof enqueued !== "boolean" || delivery === null) {
    throw new TypeError("Invalid resend email delivery response: malformed payload")
  }
  return { delivery, enqueued }
}
