import type { PickListLineRow, PickListOrderGroup } from "./types"

const PAID_PAYMENT_STATUSES = new Set([
  "captured",
  "partially_captured",
  "partially_refunded",
  "paid",
])

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function readString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key]
  return typeof v === "string" ? v : undefined
}

function readNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key]
  if (typeof v === "number" && Number.isFinite(v)) {
    return v
  }
  return undefined
}

function isPaidPaymentStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase()
  return PAID_PAYMENT_STATUSES.has(normalized)
}

function fulfillmentReadyToShip(order: Record<string, unknown>): boolean {
  const pay = (readString(order, "payment_status") ?? "").toLowerCase()
  if (!isPaidPaymentStatus(pay)) {
    return false
  }
  const fulfillments = order.fulfillments
  if (!Array.isArray(fulfillments) || fulfillments.length === 0) {
    return false
  }
  for (const raw of fulfillments) {
    if (!isRecord(raw)) {
      continue
    }
    const canceled = readString(raw, "canceled_at")
    if (canceled !== undefined && canceled.trim() !== "") {
      continue
    }
    const shippedAt = readString(raw, "shipped_at")
    if (shippedAt !== undefined && shippedAt.trim() !== "") {
      continue
    }
    const shipments = raw.shipments
    if (Array.isArray(shipments) && shipments.some((s) => isRecord(s))) {
      continue
    }
    return true
  }
  return false
}

function parseIsoDay(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return null
  }
  return d.toISOString().slice(0, 10)
}

function orderMatchesPickDate(order: Record<string, unknown>, dayIso: string): boolean {
  const created = readString(order, "created_at")
  if (created !== undefined && parseIsoDay(created) === dayIso) {
    return true
  }
  const updated = readString(order, "updated_at")
  if (updated !== undefined && parseIsoDay(updated) === dayIso) {
    return true
  }
  const fulfillments = order.fulfillments
  if (!Array.isArray(fulfillments)) {
    return false
  }
  for (const raw of fulfillments) {
    if (!isRecord(raw)) {
      continue
    }
    const createdAt = readString(raw, "created_at")
    if (createdAt !== undefined && parseIsoDay(createdAt) === dayIso) {
      return true
    }
  }
  return false
}

function customerDisplayName(order: Record<string, unknown>): string {
  const shipping = order.shipping_address
  if (isRecord(shipping)) {
    const first = readString(shipping, "first_name") ?? ""
    const last = readString(shipping, "last_name") ?? ""
    const combined = `${first} ${last}`.trim()
    if (combined !== "") {
      return combined
    }
  }
  const customer = order.customer
  if (isRecord(customer)) {
    const first = readString(customer, "first_name") ?? ""
    const last = readString(customer, "last_name") ?? ""
    const combined = `${first} ${last}`.trim()
    if (combined !== "") {
      return combined
    }
    const email = readString(customer, "email")
    if (email !== undefined) {
      return email
    }
  }
  const email = readString(order, "email")
  return email ?? "Customer"
}

function shippingCity(order: Record<string, unknown>): string | null {
  const shipping = order.shipping_address
  if (!isRecord(shipping)) {
    return null
  }
  return readString(shipping, "city") ?? null
}

function buildLines(order: Record<string, unknown>): PickListLineRow[] {
  const items = order.items
  if (!Array.isArray(items)) {
    return []
  }
  const lines: PickListLineRow[] = []
  const displayId = String(readNumber(order, "display_id") ?? readString(order, "id") ?? "")
  const orderId = readString(order, "id") ?? ""
  for (const raw of items) {
    if (!isRecord(raw)) {
      continue
    }
    const lineId = readString(raw, "id")
    if (lineId === undefined) {
      continue
    }
    const qty = readNumber(raw, "quantity") ?? 0
    if (qty <= 0) {
      continue
    }
    const fulfilledQty = readNumber(raw, "fulfilled_quantity") ?? 0
    const remaining = Math.max(0, qty - fulfilledQty)
    if (remaining <= 0) {
      continue
    }
    lines.push({
      order_id: orderId,
      display_id: displayId,
      line_item_id: lineId,
      title: readString(raw, "title") ?? "Item",
      variant_label: readString(raw, "variant_title") ?? "",
      quantity: remaining,
      sku: readString(raw, "variant_sku") ?? readString(raw, "sku") ?? null,
    })
  }
  return lines
}

/** UTC calendar day for `today` pick-list filtering. */
export function resolvePickListDayIso(dateToken: "today"): string {
  if (dateToken === "today") {
    return new Date().toISOString().slice(0, 10)
  }
  return new Date().toISOString().slice(0, 10)
}

export function buildPickListFromOrders(
  orders: Record<string, unknown>[],
  dayIso: string
): PickListOrderGroup[] {
  const groups: PickListOrderGroup[] = []
  for (const order of orders) {
    if (!fulfillmentReadyToShip(order)) {
      continue
    }
    if (!orderMatchesPickDate(order, dayIso)) {
      continue
    }
    const lines = buildLines(order)
    if (lines.length === 0) {
      continue
    }
    const orderId = readString(order, "id")
    if (orderId === undefined) {
      continue
    }
    const displayNum = readNumber(order, "display_id")
    groups.push({
      order_id: orderId,
      display_id: displayNum !== undefined ? String(displayNum) : orderId,
      customer_name: customerDisplayName(order),
      shipping_city: shippingCity(order),
      lines,
    })
  }
  groups.sort((a, b) => Number(a.display_id) - Number(b.display_id))
  return groups
}
