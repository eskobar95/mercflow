import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

export type SubscriptionConfigDto = {
  id: string
  store_id: string
  club_enabled: boolean
  club_stripe_product_id: string | null
  club_name: string | null
  club_price_monthly: string | null
  club_price_annual: string | null
  club_fallback_discount_pct: string | null
  created_at: string
  updated_at: string
}

export type UpsertSubscriptionConfigInput = {
  club_enabled: boolean
  club_name?: string | null
  club_price_monthly?: number | null
  club_price_annual?: number | null
  club_fallback_discount_pct?: number | null
}

function subscriptionConfigBase(): string {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }
  return `${base}/admin/subscription-config`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseSubscriptionConfig(payload: unknown): SubscriptionConfigDto | null {
  if (!isRecord(payload)) return null
  const row = payload.subscription_config
  if (!isRecord(row)) return null

  const id = typeof row.id === "string" ? row.id : null
  const storeId = typeof row.store_id === "string" ? row.store_id : null
  const clubEnabled = typeof row.club_enabled === "boolean" ? row.club_enabled : null

  if (id === null || storeId === null || clubEnabled === null) {
    return null
  }

  return {
    id,
    store_id: storeId,
    club_enabled: clubEnabled,
    club_stripe_product_id:
      typeof row.club_stripe_product_id === "string" ? row.club_stripe_product_id : null,
    club_name: typeof row.club_name === "string" ? row.club_name : null,
    club_price_monthly:
      typeof row.club_price_monthly === "string" || typeof row.club_price_monthly === "number"
        ? String(row.club_price_monthly)
        : null,
    club_price_annual:
      typeof row.club_price_annual === "string" || typeof row.club_price_annual === "number"
        ? String(row.club_price_annual)
        : null,
    club_fallback_discount_pct:
      typeof row.club_fallback_discount_pct === "string" ||
      typeof row.club_fallback_discount_pct === "number"
        ? String(row.club_fallback_discount_pct)
        : null,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    updated_at: typeof row.updated_at === "string" ? row.updated_at : "",
  }
}

export async function getSubscriptionConfig(): Promise<SubscriptionConfigDto | null> {
  const response = await fetch(subscriptionConfigBase(), {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  return parseSubscriptionConfig(json)
}

export async function putSubscriptionConfig(
  input: UpsertSubscriptionConfigInput
): Promise<SubscriptionConfigDto | null> {
  const response = await fetch(subscriptionConfigBase(), {
    method: "PUT",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  return parseSubscriptionConfig(json)
}
