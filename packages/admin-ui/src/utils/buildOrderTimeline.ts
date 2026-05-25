import type { OrderDetail } from "@/features/orders/orderTypes"

export type OrderTimelineStep = {
  key: "created" | "paid" | "packed" | "shipped" | "delivered"
  label: string
  reached: boolean
  timestampIso: string | null
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function readString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key]
  return typeof v === "string" ? v : undefined
}

const PAID_PAYMENT_STATUSES = new Set([
  "captured",
  "partially_refunded",
  "refunded",
])

function firstCapturedPaymentAt(order: Record<string, unknown>): string | null {
  const collections = order.payment_collections
  if (!Array.isArray(collections)) {
    return null
  }
  for (const col of collections) {
    if (!isRecord(col)) {
      continue
    }
    const payments = col.payments
    if (!Array.isArray(payments)) {
      continue
    }
    for (const pay of payments) {
      if (!isRecord(pay)) {
        continue
      }
      const capturedAt = readString(pay, "captured_at")
      if (capturedAt !== undefined) {
        return capturedAt
      }
      if (readString(pay, "status") === "captured") {
        const created = readString(pay, "created_at")
        if (created !== undefined) {
          return created
        }
      }
    }
  }
  return null
}

function fulfillmentTimes(order: Record<string, unknown>): {
  packedAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
} {
  const list = order.fulfillments
  if (!Array.isArray(list) || list.length === 0) {
    return { packedAt: null, shippedAt: null, deliveredAt: null }
  }
  let packedAt: string | null = null
  const shippedDates: number[] = []
  const deliveredDates: number[] = []
  for (const f of list) {
    if (!isRecord(f)) {
      continue
    }
    if (readString(f, "canceled_at")) {
      continue
    }
    const created = readString(f, "created_at")
    if (created !== undefined && packedAt === null) {
      packedAt = created
    }
    const shipped = readString(f, "shipped_at")
    if (shipped !== undefined) {
      const t = Date.parse(shipped)
      if (!Number.isNaN(t)) {
        shippedDates.push(t)
      }
    }
    const delivered = readString(f, "delivered_at")
    if (delivered !== undefined) {
      const t = Date.parse(delivered)
      if (!Number.isNaN(t)) {
        deliveredDates.push(t)
      }
    }
  }
  const shippedAt =
    shippedDates.length > 0
      ? new Date(Math.min(...shippedDates)).toISOString()
      : null
  const deliveredAt =
    deliveredDates.length > 0
      ? new Date(Math.max(...deliveredDates)).toISOString()
      : null
  return { packedAt, shippedAt, deliveredAt }
}

/**
 * Derives a read-only timeline from aggregate order fields and related collections.
 * Medusa does not always expose granular transition timestamps; we best-effort map fulfillments and payments.
 */
export function buildOrderTimeline(detail: OrderDetail): OrderTimelineStep[] {
  const order = detail.raw
  const createdAt = detail.createdAt
  const paymentStatus = detail.paymentStatus.toLowerCase()
  const fulfillmentStatus = detail.fulfillmentStatus.toLowerCase()

  const paidCapturedAt = firstCapturedPaymentAt(order)
  const paidReached =
    PAID_PAYMENT_STATUSES.has(paymentStatus) || paidCapturedAt !== null
  const paidAt =
    paidCapturedAt ?? (paidReached ? readString(order, "updated_at") ?? null : null)

  const { packedAt, shippedAt, deliveredAt } = fulfillmentTimes(order)

  const packedReached =
    packedAt !== null ||
    [
      "fulfilled",
      "partially_fulfilled",
      "shipped",
      "partially_shipped",
      "delivered",
      "partially_delivered",
    ].includes(fulfillmentStatus)

  const shippedReached =
    shippedAt !== null ||
    ["shipped", "partially_shipped", "delivered", "partially_delivered"].includes(
      fulfillmentStatus
    )

  const deliveredReached =
    deliveredAt !== null || ["delivered", "partially_delivered"].includes(fulfillmentStatus)

  return [
    {
      key: "created",
      label: "Created",
      reached: true,
      timestampIso: createdAt,
    },
    {
      key: "paid",
      label: "Paid",
      reached: paidReached,
      timestampIso: paidReached ? paidAt : null,
    },
    {
      key: "packed",
      label: "Packed",
      reached: packedReached,
      timestampIso: packedReached
        ? packedAt ?? readString(order, "updated_at") ?? null
        : null,
    },
    {
      key: "shipped",
      label: "Shipped",
      reached: shippedReached,
      timestampIso: shippedReached
        ? shippedAt ?? readString(order, "updated_at") ?? null
        : null,
    },
    {
      key: "delivered",
      label: "Delivered",
      reached: deliveredReached,
      timestampIso: deliveredReached
        ? deliveredAt ?? readString(order, "updated_at") ?? null
        : null,
    },
  ]
}
