import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import { parseDiscountsListEnvelope } from "./parseDiscountsListResponse"
import type { AdminDiscountListResponse } from "./types"

function serializeQuery(entries: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined) {
      params.set(key, String(value))
    }
  }
  const query = params.toString()
  return query.length > 0 ? `?${query}` : ""
}

export async function listAdminDiscounts(api?: {
  limit?: number
  offset?: number
  q?: string
  status?: "draft" | "active" | "inactive"
}): Promise<AdminDiscountListResponse> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Medusa backend URL missing — set VITE_MEDUSA_ADMIN_BACKEND_URL in the admin-ui env.",
    )
  }

  const query = serializeQuery({
    limit: api?.limit,
    offset: api?.offset,
    q: api?.q,
    status: api?.status,
  })

  const response = await fetch(`${base}/admin/discounts${query}`, {
    method: "GET",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const parsed: unknown = await parseMedusaAdminJsonResponse(response)
  const envelope = parseDiscountsListEnvelope(parsed)
  if (envelope === null) {
    throw new Error("Unexpected discount list response shape from MercFlow API.")
  }

  return envelope
}
