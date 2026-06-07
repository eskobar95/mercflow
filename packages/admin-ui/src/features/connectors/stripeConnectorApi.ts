import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

type StripeVatMode = "inclusive" | "exclusive"

export type StripeConnectorDetailDto = {
  configured: boolean
  active: boolean
  vat_mode: StripeVatMode
  secret_key_masked: string | null
  publishable_key_masked: string | null
  webhook_secret_masked: string | null
  last_tested_at: string | null
}

export type StripeConnectorSyncResultDto = {
  products_processed: number
  stripe_products_created: number
  stripe_products_updated: number
  stripe_prices_created: number
  stripe_prices_deactivated: number
}

export type StripePaymentOverviewDto = {
  id: string
  amountMinor: number
  currency: string
  status: string
  customerLabel: string | null
  createdEpoch: number
}

type StripeConnectorPatchInput = Partial<{
  secret_key: string
  publishable_key: string
  webhook_secret: string
  vat_mode: StripeVatMode
  active: boolean
}>

function stripeConnectorBase(): string {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }
  return `${base}/admin/connectors/stripe`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseStripeVat(raw: unknown): StripeVatMode {
  return raw === "exclusive" ? "exclusive" : "inclusive"
}

function parseStripeConnectorDetail(payload: unknown): StripeConnectorDetailDto | null {
  if (!isRecord(payload)) return null
  const dataUnknown = payload["data"]
  if (!isRecord(dataUnknown)) return null
  const d = dataUnknown
  return {
    configured: typeof d.configured === "boolean" ? d.configured : false,
    active: typeof d.active === "boolean" ? d.active : false,
    vat_mode: parseStripeVat(d.vat_mode),
    secret_key_masked: typeof d.secret_key_masked === "string" ? d.secret_key_masked : null,
    publishable_key_masked:
      typeof d.publishable_key_masked === "string" ? d.publishable_key_masked : null,
    webhook_secret_masked:
      typeof d.webhook_secret_masked === "string" ? d.webhook_secret_masked : null,
    last_tested_at: typeof d.last_tested_at === "string" ? d.last_tested_at : null,
  }
}

function parseStripePaymentsPayload(payload: unknown): StripePaymentOverviewDto[] | null {
  if (!isRecord(payload)) return null
  const dataUnknown = payload["data"]
  if (!isRecord(dataUnknown)) return null
  const listUnknown = dataUnknown["payments"]
  if (!Array.isArray(listUnknown)) return null

  const out: StripePaymentOverviewDto[] = []
  for (const row of listUnknown) {
    if (!isRecord(row)) continue
    const id = typeof row.id === "string" ? row.id : null
    const amountMinor = typeof row.amountMinor === "number" ? row.amountMinor : null
    const currency = typeof row.currency === "string" ? row.currency.toLowerCase() : null
    const status = typeof row.status === "string" ? row.status : null
    const createdEpoch = typeof row.createdEpoch === "number" ? row.createdEpoch : null
    let customerLabel: string | null = null
    if (row.customerLabel === null || row.customerLabel === undefined) {
      customerLabel = null
    } else if (typeof row.customerLabel === "string") {
      const trimmed = row.customerLabel.trim()
      customerLabel = trimmed !== "" ? trimmed : null
    } else {
      continue
    }
    if (id === null || amountMinor === null || currency === null || status === null || createdEpoch === null) {
      continue
    }

    out.push({
      id,
      amountMinor,
      currency,
      status,
      customerLabel,
      createdEpoch,
    })
  }
  return out
}

function parseStripeSyncPayload(
  payload: unknown
): { success: boolean; result: StripeConnectorSyncResultDto } | null {
  if (!isRecord(payload)) return null
  const dataUnknown = payload["data"]
  if (!isRecord(dataUnknown)) return null

  const ok = typeof dataUnknown.success === "boolean" ? dataUnknown.success : null
  if (ok !== true) return null

  const resUnknown = dataUnknown.result
  if (!isRecord(resUnknown)) return null

  const rr = resUnknown
  return {
    success: true,
    result: {
      products_processed: typeof rr.products_processed === "number" ? rr.products_processed : 0,
      stripe_products_created:
        typeof rr.stripe_products_created === "number" ? rr.stripe_products_created : 0,
      stripe_products_updated:
        typeof rr.stripe_products_updated === "number" ? rr.stripe_products_updated : 0,
      stripe_prices_created:
        typeof rr.stripe_prices_created === "number" ? rr.stripe_prices_created : 0,
      stripe_prices_deactivated:
        typeof rr.stripe_prices_deactivated === "number" ? rr.stripe_prices_deactivated : 0,
    },
  }
}

export async function getStripeConnectorDetail(): Promise<StripeConnectorDetailDto | null> {
  const url = stripeConnectorBase()
  const response = await fetch(url, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  return parseStripeConnectorDetail(json)
}

export async function patchStripeConnector(
  patch: StripeConnectorPatchInput
): Promise<StripeConnectorDetailDto | null> {
  const url = stripeConnectorBase()
  const response = await fetch(url, {
    method: "PATCH",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(patch),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  return parseStripeConnectorDetail(json)
}

export async function postStripeConnectionTest(): Promise<void> {
  const url = `${stripeConnectorBase()}/test`
  const response = await fetch(url, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({}),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
}

export async function postStripeSyncProducts(): Promise<StripeConnectorSyncResultDto> {
  const url = `${stripeConnectorBase()}/sync-products`
  const response = await fetch(url, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({}),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseStripeSyncPayload(json)
  if (parsed === null) {
    throw new TypeError("Invalid sync-products response payload")
  }
  return parsed.result
}

export async function getStripePayments(limit = 20): Promise<StripePaymentOverviewDto[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  const url = `${stripeConnectorBase()}/payments?${params.toString()}`
  const response = await fetch(url, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseStripePaymentsPayload(json)
  if (parsed === null) {
    throw new TypeError("Invalid payments response payload")
  }
  return parsed
}
