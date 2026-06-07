import type { AdminOrderLite } from "./customersAdminTypes"
import type { CustomerPaidSpendSummary } from "./customersAdminTypes"

/** Medusa Admin `payment_status` values that contribute to MercFlow lifetime value definition. */
const PAID_ORDER_PAYMENT_STATUSES = new Set<string>([
  "captured",
  "completed",
  "partially_captured",
])

function isPaidOrderForLifetimeValue(order: AdminOrderLite): boolean {
  if (order.payment_status === null) {
    return false
  }
  return PAID_ORDER_PAYMENT_STATUSES.has(order.payment_status)
}

export function parseOrderMinorTotal(order: AdminOrderLite): bigint {
  const raw = order.total
  if (raw === null) {
    return 0n
  }
  try {
    const n = typeof raw === "number" ? BigInt(Math.trunc(raw)) : BigInt(String(raw))
    return n >= 0n ? n : 0n
  } catch {
    return 0n
  }
}

export function emptyPaidSpendSummary(): CustomerPaidSpendSummary {
  return {
    totalOrderCount: 0,
    paidOrderCount: 0,
    lifetimeByCurrency: new Map<string, bigint>(),
  }
}

export function mergePaidSpendSummary(
  current: CustomerPaidSpendSummary,
  orders: readonly AdminOrderLite[]
): CustomerPaidSpendSummary {
  const lifetimeByCurrency = new Map(current.lifetimeByCurrency)
  let paidOrderCount = current.paidOrderCount
  const totalOrderCount = current.totalOrderCount + orders.length
  for (const order of orders) {
    if (!isPaidOrderForLifetimeValue(order)) {
      continue
    }
    paidOrderCount += 1
    const amount = parseOrderMinorTotal(order)
    if (amount === 0n) {
      continue
    }
    const code = order.currency_code.toLowerCase()
    lifetimeByCurrency.set(code, (lifetimeByCurrency.get(code) ?? 0n) + amount)
  }
  return { totalOrderCount, paidOrderCount, lifetimeByCurrency }
}

export function summarizeLifetimeDisplayText(
  summary: CustomerPaidSpendSummary
): { kind: "empty" } | { kind: "mixed" } | { kind: "single"; currency: string; minor: bigint } {
  const entries = [...summary.lifetimeByCurrency.entries()].filter(([, minor]) => {
    return minor > 0n
  })

  if (entries.length === 0) {
    return { kind: "empty" }
  }
  if (entries.length > 1) {
    return { kind: "mixed" }
  }

  const tuple = entries[0]
  if (!tuple) {
    return { kind: "empty" }
  }

  const [currency, minor] = tuple
  return { kind: "single", currency: currency ?? "usd", minor }
}
