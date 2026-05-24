import type { AdminCustomer, AdminOrderLite } from "./customersAdminTypes"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === "string") {
    return value
  }
  return null
}

export function parseAdminCustomer(value: unknown): AdminCustomer | null {
  if (!isRecord(value)) {
    return null
  }
  const id = typeof value.id === "string" ? value.id : null
  if (id === null) {
    return null
  }
  return {
    id,
    email: parseStringOrNull(value.email),
    first_name: parseStringOrNull(value.first_name),
    last_name: parseStringOrNull(value.last_name),
    phone: parseStringOrNull(value.phone),
    created_at:
      typeof value.created_at === "string" ? value.created_at : "1970-01-01T00:00:00.000Z",
  }
}

export function parseAdminCustomersListEnvelope(json: unknown): {
  customers: AdminCustomer[]
  count: number
  offset: number
  limit: number
} | null {
  if (!isRecord(json)) {
    return null
  }
  const rawCustomers = json.customers
  if (!Array.isArray(rawCustomers)) {
    return null
  }
  const customers = rawCustomers
    .map((c) => {
      return parseAdminCustomer(c)
    })
    .filter((c): c is AdminCustomer => c !== null)

  const count =
    typeof json.count === "number"
      ? json.count
      : typeof json.count === "string"
        ? Number.parseInt(json.count, 10)
        : 0

  const offset =
    typeof json.offset === "number"
      ? json.offset
      : typeof json.offset === "string"
        ? Number.parseInt(json.offset, 10)
        : 0

  const limit =
    typeof json.limit === "number"
      ? json.limit
      : typeof json.limit === "string"
        ? Number.parseInt(json.limit, 10)
        : 0

  return { customers, count: Number.isFinite(count) ? count : 0, offset: Number.isFinite(offset) ? offset : 0, limit: Number.isFinite(limit) ? limit : 0 }
}

export function parseAdminCustomerDetailEnvelope(json: unknown): AdminCustomer | null {
  if (!isRecord(json)) {
    return null
  }
  return parseAdminCustomer(json.customer)
}

export function parseAdminOrder(value: unknown): AdminOrderLite | null {
  if (!isRecord(value)) {
    return null
  }
  const id = typeof value.id === "string" ? value.id : null
  const currencyRaw = typeof value.currency_code === "string" ? value.currency_code : null
  if (id === null || currencyRaw === null) {
    return null
  }
  const paymentRaw = parseStringOrNull(value.payment_status)
  return {
    id,
    currency_code: currencyRaw,
    payment_status: paymentRaw,
    status: parseStringOrNull(value.status ?? null),
    total: typeof value.total === "string" || typeof value.total === "number" ? value.total : null,
    created_at: typeof value.created_at === "string" ? value.created_at : undefined,
  }
}

export function parseOrdersListEnvelope(json: unknown): AdminOrderLite[] | null {
  if (!isRecord(json)) {
    return null
  }
  const raw = json.orders
  if (!Array.isArray(raw)) {
    return null
  }
  return raw
    .map((item) => {
      return parseAdminOrder(item)
    })
    .filter((item): item is AdminOrderLite => item !== null)
}
