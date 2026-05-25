import {
  parseOrderDetailPayload,
  parseOrderListItem,
} from "@/features/orders/orderJson"
import type { OrderDetail, OrderListRow } from "@/features/orders/orderTypes"
import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

export type OrdersListQuery = {
  limit: number
  offset: number
  createdAtGte?: string
  createdAtLte?: string
  /** Medusa `status` filter when a single value maps cleanly. */
  status?: string
  fulfillmentStatus?: string
  paymentStatus?: string
}

function buildOrdersListSearchParams(q: OrdersListQuery): string {
  const p = new URLSearchParams()
  p.set("limit", String(q.limit))
  p.set("offset", String(q.offset))
  if (q.createdAtGte !== undefined && q.createdAtGte.trim() !== "") {
    p.set("created_at[$gte]", q.createdAtGte)
  }
  if (q.createdAtLte !== undefined && q.createdAtLte.trim() !== "") {
    p.set("created_at[$lte]", q.createdAtLte)
  }
  if (q.status !== undefined && q.status.trim() !== "") {
    p.set("status", q.status)
  }
  if (q.fulfillmentStatus !== undefined && q.fulfillmentStatus.trim() !== "") {
    p.set("fulfillment_status", q.fulfillmentStatus)
  }
  if (q.paymentStatus !== undefined && q.paymentStatus.trim() !== "") {
    p.set("payment_status", q.paymentStatus)
  }
  return p.toString()
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

export async function fetchAdminOrdersList(
  q: OrdersListQuery
): Promise<{ rows: OrderListRow[]; count: number }> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }
  const url = `${base}/admin/orders?${buildOrdersListSearchParams(q)}`
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
    throw new TypeError("Invalid orders list response")
  }
  const rawOrders = body.orders
  const countVal = body.count
  if (!Array.isArray(rawOrders)) {
    throw new TypeError("Invalid orders list response: missing orders array")
  }
  const rows: OrderListRow[] = []
  for (const item of rawOrders) {
    const row = parseOrderListItem(item)
    if (row !== null) {
      rows.push(row)
    }
  }
  const count =
    typeof countVal === "number" && !Number.isNaN(countVal) ? countVal : rows.length
  return { rows, count }
}

/**
 * Expanded relations for fulfillment actions + timeline — Medusa selects fields recursively with `*` prefix.
 * @see https://docs.medusajs.com/learn/fundamentals/api-routes/parameters#select-parameters
 */
const ADMIN_ORDER_DETAIL_FIELDS = [
  "id",
  "status",
  "display_id",
  "email",
  "currency_code",
  "created_at",
  "updated_at",
  "payment_status",
  "fulfillment_status",
  "total",
  "summary",
  "*customer",
  "*shipping_address",
  "*items",
  "*payment_collections",
  "*payment_collections.payments",
  "*fulfillments",
  "*fulfillments.items",
  "*fulfillments.shipments",
].join(",")

export async function fetchAdminOrder(orderId: string): Promise<OrderDetail> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }
  const id = encodeURIComponent(orderId)
  const qp = new URLSearchParams({ fields: ADMIN_ORDER_DETAIL_FIELDS })
  const url = `${base}/admin/orders/${id}?${qp.toString()}`
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const body = await parseMedusaAdminJsonResponse(response)
  const detail = parseOrderDetailPayload(body)
  if (detail === null) {
    throw new TypeError("Invalid order detail response")
  }
  return detail
}
