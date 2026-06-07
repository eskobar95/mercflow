import {
  buildMedusaAdminJsonHeaders,
  formatMedusaAdminHttpErrorMessageFromText,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import {
  parseAdminCustomerDetailEnvelope,
  parseAdminCustomersListEnvelope,
  parseOrdersListEnvelope,
} from "./customersAdminParsing"
import type { AdminCustomer, AdminOrderLite, CustomerPaidSpendSummary } from "./customersAdminTypes"
import { emptyPaidSpendSummary, mergePaidSpendSummary } from "./customersPaidSpend"

export class CustomersAdminConfigError extends Error {
  readonly name = "CustomersAdminConfigError"
}

async function guardBackendBase(): Promise<string> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new CustomersAdminConfigError(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (for example http://localhost:9000)."
    )
  }
  return base
}

async function readJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text()
  try {
    if (text.trim() === "") {
      throw new TypeError("Empty response body")
    }
    return JSON.parse(text) as unknown
  } catch {
    throw new Error(
      formatMedusaAdminHttpErrorMessageFromText(text, response.status, response.statusText)
    )
  }
}

function parseStoresListDefaultCurrency(envelope: unknown): string | null {
  if (typeof envelope !== "object" || envelope === null) {
    return null
  }
  const stores = (envelope as { stores?: unknown }).stores
  if (!Array.isArray(stores) || stores.length === 0) {
    return null
  }
  const first = stores[0]
  if (typeof first !== "object" || first === null) {
    return null
  }
  const codeRaw = (first as { default_currency_code?: unknown }).default_currency_code
  if (typeof codeRaw !== "string" || codeRaw.trim() === "") {
    return null
  }
  return codeRaw.trim().toLowerCase()
}

/**
 * Resolves the default store ISO currency from Medusa Admin (`GET /admin/stores`).
 * Returns null when the request fails or the payload is unusable — callers typically fall back
 * to a recent order’s `currency_code` for display formatting.
 */
export async function getStoreDefaultCurrencyCode(
  args?: { signal?: AbortSignal }
): Promise<string | null> {
  try {
    const base = await guardBackendBase()
    const params = new URLSearchParams()
    params.set("limit", "1")
    params.set("offset", "0")
    const url = `${base}/admin/stores?${params.toString()}`
    const response = await fetch(url, {
      method: "GET",
      headers: buildMedusaAdminJsonHeaders(),
      credentials: "include",
      signal: args?.signal,
    })
    if (!response.ok) {
      return null
    }
    const raw = await readJsonSafely(response)
    return parseStoresListDefaultCurrency(raw)
  } catch {
    return null
  }
}

type ListCustomersArgs = {
  readonly q?: string
  readonly limit: number
  readonly offset: number
  readonly signal?: AbortSignal
}

export async function listCustomers(
  args: ListCustomersArgs
): Promise<{ customers: AdminCustomer[]; count: number; offset: number; limit: number }> {
  const base = await guardBackendBase()
  const params = new URLSearchParams()
  params.set("limit", String(args.limit))
  params.set("offset", String(args.offset))
  const trimmedQuery = typeof args.q === "string" ? args.q.trim() : ""
  if (trimmedQuery !== "") {
    params.set("q", trimmedQuery)
  }

  const url = `${base}/admin/customers?${params.toString()}`
  const response = await fetch(url, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    signal: args.signal,
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const parsed = parseAdminCustomersListEnvelope(await readJsonSafely(response))
  if (!parsed) {
    throw new TypeError("Malformed Medusa GET /admin/customers response envelope")
  }
  return parsed
}

export async function getCustomer(
  customerId: string,
  args?: { signal?: AbortSignal }
): Promise<AdminCustomer> {
  const base = await guardBackendBase()
  const url = `${base}/admin/customers/${encodeURIComponent(customerId)}`
  const response = await fetch(url, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    signal: args?.signal,
  })

  if (response.status === 404) {
    throw new Error("Customer was not found")
  }
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const customer = parseAdminCustomerDetailEnvelope(await readJsonSafely(response))
  if (!customer) {
    throw new TypeError("Malformed Medusa GET /admin/customers/:id customer payload")
  }
  return customer
}

type FetchOrdersArgs = {
  readonly customerId: string
  readonly limit: number
  readonly offset: number
  readonly signal?: AbortSignal
}

async function fetchOrdersPage(args: FetchOrdersArgs): Promise<AdminOrderLite[]> {
  const base = await guardBackendBase()
  const params = new URLSearchParams()
  params.set("customer_id", args.customerId)
  params.set("limit", String(args.limit))
  params.set("offset", String(args.offset))
  params.set("order", "-created_at")

  const url = `${base}/admin/orders?${params.toString()}`
  const response = await fetch(url, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    signal: args.signal,
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const orders = parseOrdersListEnvelope(await readJsonSafely(response))
  if (!orders) {
    throw new TypeError("Malformed Medusa GET /admin/orders list payload")
  }
  return orders
}

export async function fetchCustomerPaidSpendSummary(
  customerId: string,
  args?: { signal?: AbortSignal }
): Promise<CustomerPaidSpendSummary> {
  let summary = emptyPaidSpendSummary()
  const pageSize = 100
  let offset = 0
  let exhausted = false

  while (!exhausted) {
    const batch = await fetchOrdersPage({
      customerId,
      limit: pageSize,
      offset,
      signal: args?.signal,
    })
    summary = mergePaidSpendSummary(summary, batch)

    offset += batch.length

    if (batch.length < pageSize || offset > 20_000) {
      exhausted = true
    }
  }

  return summary
}

export async function fetchRecentOrdersForCustomer(
  customerId: string,
  take: number,
  args?: { signal?: AbortSignal }
): Promise<AdminOrderLite[]> {
  const rows = await fetchOrdersPage({
    customerId,
    limit: take,
    offset: 0,
    signal: args?.signal,
  })
  return rows.slice().sort((a, b) => {
    const ta = a.created_at ?? ""
    const tb = b.created_at ?? ""
    return tb.localeCompare(ta)
  })
}
