import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import { parseSubscriptionDetailEnvelope } from "./parseSubscriptionDetailResponse"
import { parseSubscriptionsListEnvelope, parseSubscriptionRow } from "./parseSubscriptionsListResponse"
import type {
  AdminSubscriptionDetail,
  AdminSubscriptionListResponse,
  AdminSubscriptionRow,
} from "./types"

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

export async function listCustomerSubscriptions(
  customerId: string,
  api?: {
    limit?: number
    offset?: number
  }
): Promise<AdminSubscriptionListResponse> {
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

export async function getAdminSubscription(subscriptionId: string): Promise<AdminSubscriptionDetail> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Medusa backend URL missing — set VITE_MEDUSA_ADMIN_BACKEND_URL in the admin-ui env."
    )
  }

  const response = await fetch(`${base}/admin/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: "GET",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const parsed: unknown = await parseMedusaAdminJsonResponse(response)
  const detail = parseSubscriptionDetailEnvelope(parsed)
  if (detail === null) {
    throw new Error("Unexpected subscription detail response shape from MercFlow API.")
  }
  return detail
}

async function postSubscriptionMutation(
  subscriptionId: string,
  action: "pause" | "cancel" | "resume",
  body?: Record<string, unknown>
): Promise<AdminSubscriptionRow> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Medusa backend URL missing — set VITE_MEDUSA_ADMIN_BACKEND_URL in the admin-ui env."
    )
  }

  const response = await fetch(
    `${base}/admin/subscriptions/${encodeURIComponent(subscriptionId)}/${action}`,
    {
      method: "POST",
      credentials: "include",
      headers: buildMedusaAdminJsonHeaders(),
      body: body === undefined ? undefined : JSON.stringify(body),
    }
  )

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const parsed: unknown = await parseMedusaAdminJsonResponse(response)
  const row = parseSubscriptionRow(parsed)
  if (row === null) {
    throw new Error(`Unexpected subscription ${action} response shape from MercFlow API.`)
  }
  return row
}

export async function pauseAdminSubscription(
  subscriptionId: string,
  input?: { pause_until?: string | null }
): Promise<AdminSubscriptionRow> {
  return postSubscriptionMutation(subscriptionId, "pause", input)
}

export async function cancelAdminSubscription(subscriptionId: string): Promise<AdminSubscriptionRow> {
  return postSubscriptionMutation(subscriptionId, "cancel")
}

export async function resumeAdminSubscription(subscriptionId: string): Promise<AdminSubscriptionRow> {
  return postSubscriptionMutation(subscriptionId, "resume")
}
