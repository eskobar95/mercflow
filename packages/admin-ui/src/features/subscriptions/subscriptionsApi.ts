import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import { parseSubscriptionsListEnvelope } from "./parseSubscriptionsListResponse"
import type { AdminSubscriptionListResponse } from "./types"

function serializeQuery(entries: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(entries)) {
    if (v !== undefined) {
      params.set(k, String(v))
    }
  }
  const q = params.toString()
  return q.length > 0 ? `?${q}` : ""
}

export async function listAdminSubscriptions(api: {
  limit?: number
  offset?: number
  customer_id?: string
}): Promise<AdminSubscriptionListResponse> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Medusa backend URL missing — set VITE_MEDUSA_ADMIN_BACKEND_URL in the admin-ui env."
    )
  }

  const query = serializeQuery({
    limit: api.limit,
    offset: api.offset,
    customer_id: api.customer_id,
  })

  const response = await fetch(`${base}/admin/subscriptions${query}`, {
    method: "GET",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const parsed: unknown = await parseMedusaAdminJsonResponse(response)
  const envelope = parseSubscriptionsListEnvelope(parsed)
  if (envelope === null) {
    throw new Error("Unexpected subscription list response shape from MercFlow API.")
  }
  return envelope
}

export async function listCustomerSubscriptions(customerId: string, api?: {
  limit?: number
  offset?: number
}): Promise<AdminSubscriptionListResponse> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Medusa backend URL missing — set VITE_MEDUSA_ADMIN_BACKEND_URL in the admin-ui env."
    )
  }

  const query = serializeQuery({
    limit: api?.limit,
    offset: api?.offset,
  })

  const response = await fetch(
    `${base}/admin/customers/${encodeURIComponent(customerId)}/subscriptions${query}`,
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
  const envelope = parseSubscriptionsListEnvelope(parsed)
  if (envelope === null) {
    throw new Error("Unexpected subscriptions response shape from MercFlow customer API.")
  }
  return envelope
}
