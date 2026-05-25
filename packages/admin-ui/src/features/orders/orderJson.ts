import type {
  OrderAddress,
  OrderDetail,
  OrderLineItemRow,
  OrderListRow,
} from "@/features/orders/orderTypes"

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function readString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key]
  return typeof v === "string" ? v : undefined
}

function readNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key]
  if (typeof v === "number" && !Number.isNaN(v)) {
    return v
  }
  return undefined
}

function readDisplayId(obj: Record<string, unknown>): string {
  const d = obj.display_id
  if (typeof d === "number" && Number.isFinite(d)) {
    return String(d)
  }
  if (typeof d === "string" && d.trim() !== "") {
    return d
  }
  const id = readString(obj, "id")
  return id ?? "—"
}

function readTotalMinor(order: Record<string, unknown>): number {
  const direct = readNumber(order, "total")
  if (direct !== undefined) {
    return direct
  }
  const summary = order.summary
  if (isRecord(summary)) {
    const totals = summary.totals
    if (isRecord(totals)) {
      const cur = totals.current_order_total
      if (isRecord(cur)) {
        const v = cur.value
        if (typeof v === "number" && !Number.isNaN(v)) {
          return v
        }
      }
    }
  }
  return 0
}

function readCustomerFields(
  order: Record<string, unknown>
): { name: string; email: string } {
  const email = readString(order, "email") ?? ""
  const customer = order.customer
  if (isRecord(customer)) {
    const fn = readString(customer, "first_name") ?? ""
    const ln = readString(customer, "last_name") ?? ""
    const name = `${fn} ${ln}`.trim()
    const cEmail = readString(customer, "email") ?? email
    return { name: name || "—", email: cEmail || email || "—" }
  }
  return { name: "—", email: email || "—" }
}

function parseShippingAddress(order: Record<string, unknown>): OrderAddress | null {
  const addr = order.shipping_address
  if (!isRecord(addr)) {
    return null
  }
  const line1 = readString(addr, "address_1") ?? ""
  const line2 = readString(addr, "address_2") ?? null
  const city = readString(addr, "city") ?? null
  const postal = readString(addr, "postal_code") ?? null
  const country = readString(addr, "country_code") ?? null
  const province = readString(addr, "province") ?? null
  const fn = readString(addr, "first_name") ?? ""
  const ln = readString(addr, "last_name") ?? ""
  const name = `${fn} ${ln}`.trim() || "—"
  if (
    line1 === "" &&
    (city === null || city === "") &&
    (postal === null || postal === "")
  ) {
    return null
  }
  return {
    line1,
    line2: line2 && line2.trim() !== "" ? line2 : null,
    city,
    postalCode: postal,
    countryCode: country,
    province: province && province.trim() !== "" ? province : null,
    name,
  }
}

function parseLineItems(order: Record<string, unknown>): OrderLineItemRow[] {
  const items = order.items
  if (!Array.isArray(items)) {
    return []
  }
  const rows: OrderLineItemRow[] = []
  for (const raw of items) {
    if (!isRecord(raw)) {
      continue
    }
    const id = readString(raw, "id")
    if (!id) {
      continue
    }
    const title = readString(raw, "title") ?? "—"
    const variantTitle = readString(raw, "variant_title")
    const subtitle = readString(raw, "subtitle")
    const variantLabel =
      [variantTitle, subtitle].filter(Boolean).join(" · ") || "—"
    const qty = readNumber(raw, "quantity") ?? 0
    const unit = readNumber(raw, "unit_price") ?? 0
    const total = readNumber(raw, "total") ?? unit * qty
    const thumb = readString(raw, "thumbnail")
    rows.push({
      id,
      title,
      variantLabel,
      quantity: qty,
      unitPriceMinor: unit,
      rowTotalMinor: total,
      thumbnailUrl: thumb && thumb.trim() !== "" ? thumb : null,
    })
  }
  return rows
}

export function parseOrderListItem(raw: unknown): OrderListRow | null {
  if (!isRecord(raw)) {
    return null
  }
  const id = readString(raw, "id")
  if (!id) {
    return null
  }
  const currency = readString(raw, "currency_code") ?? "dkk"
  const { name, email } = readCustomerFields(raw)
  const created = readString(raw, "created_at") ?? new Date().toISOString()
  return {
    id,
    displayId: readDisplayId(raw),
    orderStatus: readString(raw, "status") ?? "unknown",
    customerName: name,
    customerEmail: email,
    createdAt: created,
    paymentStatus: readString(raw, "payment_status") ?? "unknown",
    fulfillmentStatus: readString(raw, "fulfillment_status") ?? "unknown",
    totalMinor: readTotalMinor(raw),
    currencyCode: currency,
  }
}

export function parseOrderDetailPayload(raw: unknown): OrderDetail | null {
  if (!isRecord(raw)) {
    return null
  }
  const order = raw.order
  if (!isRecord(order)) {
    return null
  }
  const id = readString(order, "id")
  if (!id) {
    return null
  }
  const currency = readString(order, "currency_code") ?? "dkk"
  const { email } = readCustomerFields(order)
  const guestEmail = readString(order, "email")
  const customerRecord = order.customer
  let customer: OrderDetail["customer"] = null
  if (isRecord(customerRecord)) {
    customer = {
      id: readString(customerRecord, "id") ?? null,
      firstName: readString(customerRecord, "first_name") ?? null,
      lastName: readString(customerRecord, "last_name") ?? null,
      email: readString(customerRecord, "email") ?? null,
    }
  }
  const resolvedCustomer =
    customer ??
    (guestEmail !== undefined && guestEmail.trim() !== ""
      ? {
          id: null,
          firstName: null,
          lastName: null,
          email: guestEmail,
        }
      : null)
  const display = readDisplayId(order)
  return {
    id,
    displayId: display,
    status: readString(order, "status") ?? "unknown",
    email: guestEmail ?? email,
    createdAt: readString(order, "created_at") ?? new Date().toISOString(),
    updatedAt: readString(order, "updated_at") ?? new Date().toISOString(),
    paymentStatus: readString(order, "payment_status") ?? "unknown",
    fulfillmentStatus: readString(order, "fulfillment_status") ?? "unknown",
    totalMinor: readTotalMinor(order),
    currencyCode: currency,
    customer: resolvedCustomer,
    shippingAddress: parseShippingAddress(order),
    lineItems: parseLineItems(order),
    raw: order,
  }
}
