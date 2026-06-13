import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

export type PaymentMode = "test" | "live"

export type PaymentProviderDto = {
  id: string | null
  store_id: string
  provider: "stripe"
  mode: PaymentMode
  publishable_key: string | null
  test_publishable_key: string | null
  live_publishable_key: string | null
  test_has_secret_key: boolean
  live_has_secret_key: boolean
  test_has_webhook_secret: boolean
  live_has_webhook_secret: boolean
  configured: boolean
}

export type UpsertPaymentProviderInput = {
  test_secret_key?: string | null
  test_publishable_key?: string | null
  test_webhook_secret?: string | null
  live_secret_key?: string | null
  live_publishable_key?: string | null
  live_webhook_secret?: string | null
}

function paymentProvidersBase(): string {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }
  return `${base}/admin/payment-providers`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parsePaymentProvider(payload: unknown): PaymentProviderDto | null {
  if (!isRecord(payload)) return null
  const row = payload.payment_provider
  if (!isRecord(row)) return null

  const storeId = typeof row.store_id === "string" ? row.store_id : null
  const mode = row.mode === "live" ? "live" : row.mode === "test" ? "test" : null
  const provider = row.provider === "stripe" ? "stripe" : null

  if (storeId === null || mode === null || provider === null) {
    return null
  }

  return {
    id: typeof row.id === "string" ? row.id : null,
    store_id: storeId,
    provider,
    mode,
    publishable_key: typeof row.publishable_key === "string" ? row.publishable_key : null,
    test_publishable_key:
      typeof row.test_publishable_key === "string" ? row.test_publishable_key : null,
    live_publishable_key:
      typeof row.live_publishable_key === "string" ? row.live_publishable_key : null,
    test_has_secret_key: row.test_has_secret_key === true,
    live_has_secret_key: row.live_has_secret_key === true,
    test_has_webhook_secret: row.test_has_webhook_secret === true,
    live_has_webhook_secret: row.live_has_webhook_secret === true,
    configured: row.configured === true,
  }
}

export async function getPaymentProvider(): Promise<PaymentProviderDto | null> {
  const response = await fetch(paymentProvidersBase(), {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  return parsePaymentProvider(json)
}

export async function putPaymentProvider(
  input: UpsertPaymentProviderInput
): Promise<PaymentProviderDto | null> {
  const response = await fetch(paymentProvidersBase(), {
    method: "PUT",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  return parsePaymentProvider(json)
}

export async function postPaymentProviderMode(mode: PaymentMode): Promise<PaymentProviderDto | null> {
  const response = await fetch(`${paymentProvidersBase()}/mode`, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({ mode }),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  return parsePaymentProvider(json)
}

export function buildStripeWebhookUrl(storefrontUrl: string | null): string {
  const trimmed = storefrontUrl?.trim() ?? ""
  if (trimmed !== "") {
    const normalized = trimmed.replace(/\/+$/, "")
    return `${normalized}/webhooks/stripe`
  }
  return "https://[your-store-domain]/webhooks/stripe"
}

export type PaymentStatusBadge = {
  label: string
  variant: "neutral" | "accent" | "success" | "warning" | "danger"
}

export function resolvePaymentStatusBadge(config: PaymentProviderDto | null): PaymentStatusBadge {
  if (config === null || !config.configured) {
    return { label: "Not configured", variant: "neutral" }
  }

  if (config.mode === "live") {
    if (config.live_has_secret_key) {
      return { label: "Live mode — active", variant: "success" }
    }
    return { label: "Live mode — missing credentials", variant: "warning" }
  }

  if (config.test_has_secret_key) {
    return { label: "Test mode — connected", variant: "accent" }
  }

  return { label: "Not configured", variant: "neutral" }
}
