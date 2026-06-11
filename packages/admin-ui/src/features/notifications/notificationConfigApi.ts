import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import {
  type EmailBrandingFormValues,
  type EmailConfigDto,
  formValuesToBrandingPayload,
  formValuesToPreviewQuery,
} from "./types"

function parseEmailConfig(json: unknown): EmailConfigDto | null {
  if (typeof json !== "object" || json === null || !("email_config" in json)) return null
  const raw = (json as Record<string, unknown>).email_config
  if (typeof raw !== "object" || raw === null) return null
  const row = raw as Record<string, unknown>
  if (typeof row.id !== "string" || typeof row.store_id !== "string") return null
  return {
    id: row.id,
    store_id: row.store_id,
    domain: typeof row.domain === "string" ? row.domain : null,
    from_email: typeof row.from_email === "string" ? row.from_email : null,
    from_name: typeof row.from_name === "string" ? row.from_name : null,
    reply_to: typeof row.reply_to === "string" ? row.reply_to : null,
    logo_url: typeof row.logo_url === "string" ? row.logo_url : null,
    brand_color: typeof row.brand_color === "string" ? row.brand_color : null,
    support_email: typeof row.support_email === "string" ? row.support_email : null,
    ses_domain_status:
      row.ses_domain_status === "verified" || row.ses_domain_status === "failed"
        ? row.ses_domain_status
        : "pending",
    ses_identity_arn: typeof row.ses_identity_arn === "string" ? row.ses_identity_arn : null,
    fallback_from: typeof row.fallback_from === "string" ? row.fallback_from : null,
  }
}

async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error("Missing VITE_MEDUSA_ADMIN_BACKEND_URL.")
  }
  return fetch(`${base}${path}`, {
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
    ...init,
  })
}

export async function getAdminEmailConfig(): Promise<EmailConfigDto> {
  const response = await adminFetch("/admin/notification-config", { method: "GET" })
  if (!response.ok) throw new Error(await readMedusaAdminHttpErrorMessage(response))
  const parsed = parseEmailConfig(await parseMedusaAdminJsonResponse(response))
  if (parsed === null) throw new TypeError("Invalid email_config response")
  return parsed
}

export async function putAdminEmailBranding(values: EmailBrandingFormValues): Promise<EmailConfigDto> {
  const response = await adminFetch("/admin/notification-config/branding", {
    method: "PUT",
    body: JSON.stringify(formValuesToBrandingPayload(values)),
  })
  if (!response.ok) throw new Error(await readMedusaAdminHttpErrorMessage(response))
  const parsed = parseEmailConfig(await parseMedusaAdminJsonResponse(response))
  if (parsed === null) throw new TypeError("Invalid email_config response")
  return parsed
}

export async function getAdminEmailPreview(
  templateKey: "order-confirmation",
  values: EmailBrandingFormValues,
): Promise<string> {
  const query = formValuesToPreviewQuery(values).toString()
  const path = query
    ? `/admin/notification-config/preview/${templateKey}?${query}`
    : `/admin/notification-config/preview/${templateKey}`
  const response = await adminFetch(path, { method: "GET" })
  if (!response.ok) throw new Error(await readMedusaAdminHttpErrorMessage(response))
  const json = await parseMedusaAdminJsonResponse(response)
  if (typeof json !== "object" || json === null || typeof (json as { html?: unknown }).html !== "string") {
    throw new TypeError("Invalid preview response")
  }
  return (json as { html: string }).html
}
