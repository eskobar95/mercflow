import type { OrderDetail } from "@/features/orders/orderTypes"
import { orderIndicatesPaidCapture } from "@/utils/buildOrderTimeline"

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function readString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key]
  return typeof v === "string" ? v : undefined
}

/**
 * Remaining quantity per order line item Medusa can still fulfill.
 */
export function buildFulfillmentItemsFromOrderRaw(
  order: Record<string, unknown>
): { id: string; quantity: number }[] {
  const items = order.items
  if (!Array.isArray(items)) {
    return []
  }
  const result: { id: string; quantity: number }[] = []
  for (const raw of items) {
    if (!isRecord(raw)) {
      continue
    }
    const id = readString(raw, "id")
    if (id === undefined) {
      continue
    }
    const qty =
      typeof raw.quantity === "number" && !Number.isNaN(raw.quantity) ? raw.quantity : 0
    const fulfilledRaw = raw.fulfilled_quantity
    const fulfilled =
      typeof fulfilledRaw === "number" && !Number.isNaN(fulfilledRaw) ? fulfilledRaw : 0
    const remaining = Math.max(0, qty - fulfilled)
    if (remaining > 0) {
      result.push({ id, quantity: remaining })
    }
  }
  return result
}

/** First payment that still needs capture (Medusa `awaiting` or similar, not yet captured). */
export function findCapturablePaymentId(order: Record<string, unknown>): string | null {
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
      const id = readString(pay, "id")
      if (id === undefined) {
        continue
      }
      const capturedAt = readString(pay, "captured_at")
      if (capturedAt !== undefined && capturedAt.trim() !== "") {
        continue
      }
      const status = (readString(pay, "status") ?? "").toLowerCase()
      if (status === "captured" || status === "refunded" || status === "partially_refunded") {
        continue
      }
      const ps = (readString(pay, "payment_status") ?? "").toLowerCase()
      if (status === "awaiting" || ps === "awaiting" || status === "authorized") {
        return id
      }
    }
  }
  return null
}

/** Active fulfillment that is not canceled and has no ship timestamp yet. */
export function findFirstUnshippedFulfillmentId(order: Record<string, unknown>): string | null {
  const list = order.fulfillments
  if (!Array.isArray(list)) {
    return null
  }
  for (const raw of list) {
    if (!isRecord(raw)) {
      continue
    }
    const canceled = readString(raw, "canceled_at")
    if (canceled !== undefined && canceled.trim() !== "") {
      continue
    }
    const id = readString(raw, "id")
    if (id === undefined) {
      continue
    }
    const shippedAt = readString(raw, "shipped_at")
    if (shippedAt === undefined || shippedAt.trim() === "") {
      return id
    }
  }
  return null
}

export type OrderFulfillmentActionVisibility = {
  showCapturePayment: boolean
  showCreateFulfillment: boolean
  showMarkShipped: boolean
  capturablePaymentId: string | null
  unshippedFulfillmentId: string | null
  fulfillmentItemsPayload: { id: string; quantity: number }[]
}

export function getOrderFulfillmentActionVisibility(
  detail: OrderDetail
): OrderFulfillmentActionVisibility {
  const order = detail.raw
  const paymentStatus = detail.paymentStatus.trim().toLowerCase()
  const capturablePaymentId = findCapturablePaymentId(order)
  const showCapturePayment =
    paymentStatus === "awaiting" || capturablePaymentId !== null

  const fulfillmentItemsPayload = buildFulfillmentItemsFromOrderRaw(order)
  const unshippedFulfillmentId = findFirstUnshippedFulfillmentId(order)
  const paid = orderIndicatesPaidCapture(detail)

  const showMarkShipped = unshippedFulfillmentId !== null
  const showCreateFulfillment =
    paid &&
    fulfillmentItemsPayload.length > 0 &&
    unshippedFulfillmentId === null &&
    !showCapturePayment

  return {
    showCapturePayment,
    showCreateFulfillment,
    showMarkShipped,
    capturablePaymentId,
    unshippedFulfillmentId,
    fulfillmentItemsPayload,
  }
}
