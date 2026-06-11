import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import {
  type DomainDnsRecords,
  type DomainDnsRecordRow,
  type DomainStatusResult,
  type EmailBrandingFormValues,
  type EmailConfigDto,
  type SetupDomainResult,
  formValuesToBrandingPayload,
  formValuesToPreviewQuery,
  isSesDomainStatus,
} from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseDnsRecordRow(raw: unknown): DomainDnsRecordRow | null {
  if (!isRecord(raw)) {
    return null
  }
  const type = raw.type
  const name = raw.name
  const value = raw.value
  if (
    (type !== "CNAME" && type !== "TXT") ||
    typeof name !== "string" ||
    typeof value !== "string"
  ) {
    return null
  }
  return { type, name, value }
}

function parseDnsRecords(raw: unknown): DomainDnsRecords | null {
  if (!isRecord(raw)) {
    return null
  }
  const dkimRaw = raw.dkim
  const spfRaw = raw.spf
  if (!Array.isArray(dkimRaw) || !isRecord(spfRaw)) {
    return null
  }
  const dkim: DomainDnsRecordRow[] = []
  for (const item of dkimRaw) {
    const parsed = parseDnsRecordRow(item)
    if (parsed !== null) {
      dkim.push(parsed)
    }
  }
  const spf = parseDnsRecordRow(spfRaw)
  if (spf === null) {
    return null
  }
  return { dkim, spf }
}

function parseEmailConfig(json: unknown): EmailConfigDto | null {
  if (!isRecord(json) || !("email_config" in json)) return null
  const raw = json.email_config
  if (!isRecord(raw)) return null
  if (typeof raw.id !== "string" || typeof raw.store_id !== "string") return null
  const status = raw.ses_domain_status
  return {
    id: raw.id,
    store_id: raw.store_id,
    domain: typeof raw.domain === "string" ? raw.domain : null,
    from_email: typeof raw.from_email === "string" ? raw.from_email : null,
    from_name: typeof raw.from_name === "string" ? raw.from_name : null,
    reply_to: typeof raw.reply_to === "string" ? raw.reply_to : null,
    logo_url: typeof raw.logo_url === "string" ? raw.logo_url : null,
    brand_color: typeof raw.brand_color === "string" ? raw.brand_color : null,
    support_email: typeof raw.support_email === "string" ? raw.support_email : null,
    ses_domain_status: typeof status === "string" && isSesDomainStatus(status) ? status : "pending",
    ses_identity_arn: typeof raw.ses_identity_arn === "string" ? raw.ses_identity_arn : null,
    fallback_from: typeof raw.fallback_from === "string" ? raw.fallback_from : null,
    dns_records: parseDnsRecords(raw.dns_records),
  }
}

function parseSetupDomainResult(json: unknown): SetupDomainResult | null {
  if (!isRecord(json)) {
    return null
  }
  const domain = json.domain
  const records = parseDnsRecords(json.records)
  const status = json.ses_domain_status
  const fallbackFrom = json.fallback_from
  if (
    typeof domain !== "string" ||
    records === null ||
    typeof status !== "string" ||
    !isSesDomainStatus(status) ||
    typeof fallbackFrom !== "string"
  ) {
    return null
  }
  return {
    domain,
    records,
    ses_domain_status: status,
    fallback_from: fallbackFrom,
  }
}

function parseDomainStatusResult(json: unknown): DomainStatusResult | null {
  if (!isRecord(json)) {
    return null
  }
  const status = json.status
  const fallbackFrom = json.fallback_from
  if (typeof status !== "string" || !isSesDomainStatus(status) || typeof fallbackFrom !== "string") {
    return null
  }
  return {
    status,
    records: parseDnsRecords(json.records),
    fallback_from: fallbackFrom,
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

export async function postAdminSetupDomain(domain: string): Promise<SetupDomainResult> {
  const response = await adminFetch("/admin/notification-config/domain", {
    method: "POST",
    body: JSON.stringify({ domain: domain.trim() }),
  })
  if (!response.ok) throw new Error(await readMedusaAdminHttpErrorMessage(response))
  const parsed = parseSetupDomainResult(await parseMedusaAdminJsonResponse(response))
  if (parsed === null) throw new TypeError("Invalid setup domain response")
  return parsed
}

export async function getAdminDomainStatus(): Promise<DomainStatusResult> {
  const response = await adminFetch("/admin/notification-config/domain/status", {
    method: "GET",
  })
  if (!response.ok) throw new Error(await readMedusaAdminHttpErrorMessage(response))
  const parsed = parseDomainStatusResult(await parseMedusaAdminJsonResponse(response))
  if (parsed === null) throw new TypeError("Invalid domain status response")
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
