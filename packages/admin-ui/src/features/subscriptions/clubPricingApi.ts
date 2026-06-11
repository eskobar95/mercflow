import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

export type ClubMemberPriceEntry = {
  variant_id: string
  amount: number
  currency_code: string
}

export type ProductClubPricingPayload = {
  club_enabled: boolean
  prices: ClubMemberPriceEntry[]
}

function parseProductClubPricingPayload(parsed: unknown): ProductClubPricingPayload | null {
  if (parsed === null || typeof parsed !== "object") {
    return null
  }
  const envelope = parsed as { data?: unknown }
  if (envelope.data === null || typeof envelope.data !== "object") {
    return null
  }
  const data = envelope.data as {
    club_enabled?: unknown
    prices?: unknown
  }
  if (typeof data.club_enabled !== "boolean" || !Array.isArray(data.prices)) {
    return null
  }

  const prices: ClubMemberPriceEntry[] = []
  for (const row of data.prices) {
    if (row === null || typeof row !== "object") {
      continue
    }
    const entry = row as {
      variant_id?: unknown
      amount?: unknown
      currency_code?: unknown
    }
    if (
      typeof entry.variant_id === "string" &&
      typeof entry.amount === "number" &&
      typeof entry.currency_code === "string"
    ) {
      prices.push({
        variant_id: entry.variant_id,
        amount: entry.amount,
        currency_code: entry.currency_code,
      })
    }
  }

  return {
    club_enabled: data.club_enabled,
    prices,
  }
}

export async function fetchProductClubPricing(
  productId: string
): Promise<ProductClubPricingPayload> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Medusa backend URL missing — set VITE_MEDUSA_ADMIN_BACKEND_URL in the admin-ui env."
    )
  }

  const response = await fetch(
    `${base}/admin/products/${encodeURIComponent(productId)}/club-pricing`,
    {
      method: "GET",
      credentials: "include",
      headers: buildMedusaAdminJsonHeaders(),
    }
  )

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const parsed: unknown = await parseMedusaAdminJsonResponse(response)
  const payload = parseProductClubPricingPayload(parsed)
  if (payload === null) {
    throw new Error("Unexpected club pricing response shape from MercFlow API.")
  }
  return payload
}

export async function upsertClubMemberPrice(
  productId: string,
  input: ClubMemberPriceEntry
): Promise<ClubMemberPriceEntry> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Medusa backend URL missing — set VITE_MEDUSA_ADMIN_BACKEND_URL in the admin-ui env."
    )
  }

  const response = await fetch(
    `${base}/admin/products/${encodeURIComponent(productId)}/club-pricing`,
    {
      method: "PUT",
      credentials: "include",
      headers: buildMedusaAdminJsonHeaders(),
      body: JSON.stringify(input),
    }
  )

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const parsed: unknown = await parseMedusaAdminJsonResponse(response)
  if (parsed === null || typeof parsed !== "object") {
    throw new Error("Unexpected club pricing upsert response shape from MercFlow API.")
  }
  const envelope = parsed as { data?: unknown }
  if (envelope.data === null || typeof envelope.data !== "object") {
    throw new Error("Unexpected club pricing upsert response shape from MercFlow API.")
  }
  const data = envelope.data as {
    variant_id?: unknown
    amount?: unknown
    currency_code?: unknown
  }
  if (
    typeof data.variant_id !== "string" ||
    typeof data.amount !== "number" ||
    typeof data.currency_code !== "string"
  ) {
    throw new Error("Unexpected club pricing upsert response shape from MercFlow API.")
  }

  return {
    variant_id: data.variant_id,
    amount: data.amount,
    currency_code: data.currency_code,
  }
}

export async function deleteClubMemberPrice(
  productId: string,
  variantId: string
): Promise<void> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Medusa backend URL missing — set VITE_MEDUSA_ADMIN_BACKEND_URL in the admin-ui env."
    )
  }

  const response = await fetch(
    `${base}/admin/products/${encodeURIComponent(productId)}/club-pricing/${encodeURIComponent(variantId)}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: buildMedusaAdminJsonHeaders(),
    }
  )

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
}
