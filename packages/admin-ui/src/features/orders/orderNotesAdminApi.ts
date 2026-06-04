import {
  appendMercflowStoreQuery,
  resolveMercflowStoreIdForAdmin,
} from "@/features/orders/resolveMercflowStoreId"
import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

export type MercflowOrderNote = {
  id: string
  order_id: string
  store_id: string
  content: string
  created_by: string
  created_at: string
}

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

function parseNote(raw: unknown): MercflowOrderNote | null {
  if (!isRecord(raw)) {
    return null
  }
  const id = raw.id
  const orderId = raw.order_id
  const storeId = raw.store_id
  const content = raw.content
  const createdBy = raw.created_by
  const createdAt = raw.created_at
  if (
    typeof id !== "string" ||
    typeof orderId !== "string" ||
    typeof storeId !== "string" ||
    typeof content !== "string" ||
    typeof createdBy !== "string" ||
    typeof createdAt !== "string"
  ) {
    return null
  }
  return {
    id,
    order_id: orderId,
    store_id: storeId,
    content,
    created_by: createdBy,
    created_at: createdAt,
  }
}

export async function fetchMercflowOrderNotes(orderId: string): Promise<MercflowOrderNote[]> {
  const base = requireBackendBase()
  const storeId = resolveMercflowStoreIdForAdmin()
  const url = appendMercflowStoreQuery(
    `${base}/admin/orders/${encodeURIComponent(orderId)}/notes`,
    storeId
  )
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const body = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(body) || !Array.isArray(body.notes)) {
    throw new TypeError("Invalid MercFlow order notes response")
  }
  const notes: MercflowOrderNote[] = []
  for (const row of body.notes) {
    const parsed = parseNote(row)
    if (parsed !== null) {
      notes.push(parsed)
    }
  }
  return notes
}

export async function createMercflowOrderNote(
  orderId: string,
  content: string
): Promise<MercflowOrderNote> {
  const base = requireBackendBase()
  const storeId = resolveMercflowStoreIdForAdmin()
  const url = appendMercflowStoreQuery(
    `${base}/admin/orders/${encodeURIComponent(orderId)}/notes`,
    storeId
  )
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
    body: JSON.stringify({ content: content.trim() }),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const body = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(body)) {
    throw new TypeError("Invalid MercFlow order note create response")
  }
  const parsed = parseNote(body.note)
  if (parsed === null) {
    throw new TypeError("Invalid MercFlow order note payload")
  }
  return parsed
}

export async function deleteMercflowOrderNote(
  orderId: string,
  noteId: string
): Promise<void> {
  const base = requireBackendBase()
  const storeId = resolveMercflowStoreIdForAdmin()
  const url = appendMercflowStoreQuery(
    `${base}/admin/orders/${encodeURIComponent(orderId)}/notes/${encodeURIComponent(noteId)}`,
    storeId
  )
  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
}

export type PickListOrderGroup = {
  order_id: string
  display_id: string
  customer_name: string
  shipping_city: string | null
  lines: {
    line_item_id: string
    title: string
    variant_label: string
    quantity: number
    sku: string | null
  }[]
}

export async function fetchMercflowPickList(date: "today" = "today"): Promise<{
  day: string
  orders: PickListOrderGroup[]
}> {
  const base = requireBackendBase()
  const storeId = resolveMercflowStoreIdForAdmin()
  const qp = new URLSearchParams({ date })
  let url = `${base}/admin/orders/pick-list?${qp.toString()}`
  url = appendMercflowStoreQuery(url, storeId)
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const body = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(body) || !Array.isArray(body.orders)) {
    throw new TypeError("Invalid pick list response")
  }
  const day = typeof body.day === "string" ? body.day : ""
  const orders: PickListOrderGroup[] = []
  for (const raw of body.orders) {
    if (!isRecord(raw)) {
      continue
    }
    const orderId = raw.order_id
    const displayId = raw.display_id
    const customerName = raw.customer_name
    const shippingCity = raw.shipping_city
    const linesRaw = raw.lines
    if (
      typeof orderId !== "string" ||
      typeof displayId !== "string" ||
      typeof customerName !== "string" ||
      !Array.isArray(linesRaw)
    ) {
      continue
    }
    const lines: PickListOrderGroup["lines"] = []
    for (const line of linesRaw) {
      if (!isRecord(line)) {
        continue
      }
      const lineItemId = line.line_item_id
      const title = line.title
      const variantLabel = line.variant_label
      const quantity = line.quantity
      if (
        typeof lineItemId !== "string" ||
        typeof title !== "string" ||
        typeof variantLabel !== "string" ||
        typeof quantity !== "number"
      ) {
        continue
      }
      lines.push({
        line_item_id: lineItemId,
        title,
        variant_label: variantLabel,
        quantity,
        sku: typeof line.sku === "string" ? line.sku : null,
      })
    }
    orders.push({
      order_id: orderId,
      display_id: displayId,
      customer_name: customerName,
      shipping_city: typeof shippingCity === "string" ? shippingCity : null,
      lines,
    })
  }
  return { day, orders }
}
