import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function requireBackendBase(): string {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }
  return base
}

export async function fetchFirstStockLocationId(): Promise<string | null> {
  const base = requireBackendBase()
  const url = `${base}/admin/stock-locations?limit=10&offset=0`
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const body = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(body)) {
    return null
  }
  const list = body.stock_locations
  if (!Array.isArray(list) || list.length === 0) {
    return null
  }
  const first = list[0]
  if (!isRecord(first)) {
    return null
  }
  const id = first.id
  return typeof id === "string" ? id : null
}

export async function postCaptureAdminPayment(paymentId: string): Promise<void> {
  const base = requireBackendBase()
  const url = `${base}/admin/payments/${encodeURIComponent(paymentId)}/capture`
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
    body: JSON.stringify({}),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
}

export async function postCreateOrderFulfillment(
  orderId: string,
  body: {
    items: { id: string; quantity: number }[]
    location_id: string
  }
): Promise<void> {
  const base = requireBackendBase()
  const url = `${base}/admin/orders/${encodeURIComponent(orderId)}/fulfillments`
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
}

export async function postCreateFulfillmentShipment(
  orderId: string,
  fulfillmentId: string
): Promise<void> {
  const base = requireBackendBase()
  const url = `${base}/admin/orders/${encodeURIComponent(orderId)}/fulfillments/${encodeURIComponent(fulfillmentId)}/shipments`
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
    body: JSON.stringify({}),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
}

export async function postOrderAdminNote(orderId: string, value: string): Promise<void> {
  const trimmed = value.trim()
  if (trimmed === "") {
    throw new Error("Note text cannot be empty")
  }
  const base = requireBackendBase()
  const url = `${base}/admin/notes`
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
    body: JSON.stringify({
      resource_id: orderId,
      resource_type: "order",
      value: trimmed,
    }),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
}
