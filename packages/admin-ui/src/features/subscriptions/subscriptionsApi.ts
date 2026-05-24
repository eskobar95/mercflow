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

export async function retrieveAdminCustomer(
  customerId: string
): Promise<{ id: string; email?: string | null; first_name?: string | null; last_name?: string | null } | null> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Medusa backend URL missing — set VITE_MEDUSA_ADMIN_BACKEND_URL in the admin-ui env."
    )
  }

  const response = await fetch(
    `${base}/admin/customers/${encodeURIComponent(customerId)}`,
    {
      method: "GET",
      credentials: "include",
      headers: buildMedusaAdminJsonHeaders(),
    }
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const parsed: unknown = await parseMedusaAdminJsonResponse(response)
  if (typeof parsed !== "object" || parsed === null) {
    return null
  }
  const customer = (parsed as { customer?: unknown }).customer
  if (typeof customer !== "object" || customer === null) {
    return null
  }
  const c = customer as Record<string, unknown>
  if (typeof c.id !== "string") {
    return null
  }
  return {
    id: c.id,
    email:
      typeof c.email === "string" || c.email === null
        ? (c.email as string | null)
        : undefined,
    first_name:
      typeof c.first_name === "string" || c.first_name === null
        ? (c.first_name as string | null)
        : undefined,
    last_name:
      typeof c.last_name === "string" || c.last_name === null
        ? (c.last_name as string | null)
        : undefined,
  }
}
