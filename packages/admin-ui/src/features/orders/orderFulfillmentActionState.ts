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
function buildFulfillmentItemsFromOrderRaw(
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
function findCapturablePaymentId(order: Record<string, unknown>): string | null {
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

function readPositiveNumber(raw: Record<string, unknown>, key: string): number | undefined {
  const v = raw[key]
  if (typeof v === "number" && Number.isFinite(v) && !Number.isNaN(v)) {
    return v
  }
  return undefined
}

/** Active fulfillment awaiting a shipment registration in Medusa. */
type UnfulfilledShipmentTarget = {
  fulfillmentId: string
  shipmentItems: { id: string; quantity: number }[]
}

/**
 * Locate the first fulfillment that is not canceled, has no shipments yet, and is not flagged shipped.
 */
function resolveUnshippedFulfillmentShipment(
  order: Record<string, unknown>
): UnfulfilledShipmentTarget | null {
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
    const shipments = raw.shipments
    if (Array.isArray(shipments) && shipments.some((s) => isRecord(s))) {
      continue
    }
    const shippedAt = readString(raw, "shipped_at")
    if (shippedAt !== undefined && shippedAt.trim() !== "") {
      continue
    }

    const shipmentItems: { id: string; quantity: number }[] = []
    const itemRows = raw.items
    if (Array.isArray(itemRows)) {
      for (const row of itemRows) {
        if (!isRecord(row)) {
          continue
        }
        const lineId = readString(row, "id") ?? readString(row, "line_item_id")
        const qty = readPositiveNumber(row, "quantity") ?? 0
        if (lineId !== undefined && lineId.trim() !== "" && qty > 0) {
          shipmentItems.push({ id: lineId, quantity: qty })
        }
      }
    }
    return {
      fulfillmentId: id,
      shipmentItems,
    }
  }
  return null
}

type OrderFulfillmentActionVisibility = {
  showCapturePayment: boolean
  showCreateFulfillment: boolean
  showMarkShipped: boolean
  showGenerateLabel: boolean
  labelFulfillmentId: string | null
  capturablePaymentId: string | null
  unshippedFulfillmentId: string | null
  /** Line items on the fulfillment record that should be submitted to the shipment route. */
  shipmentItemsPayload: { id: string; quantity: number }[]
  fulfillmentItemsPayload: { id: string; quantity: number }[]
}

function resolveLabelFulfillmentId(order: Record<string, unknown>): string | null {
  const pending = resolveUnshippedFulfillmentShipment(order)
  if (pending !== null) {
    return pending.fulfillmentId
  }

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
    if (id !== undefined) {
      return id
    }
  }

  return null
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
  const pendingShipment = resolveUnshippedFulfillmentShipment(order)
  const unshippedFulfillmentId = pendingShipment?.fulfillmentId ?? null
  const shipmentItemsPayload = pendingShipment?.shipmentItems ?? []
  const paid = orderIndicatesPaidCapture(detail)

  const showMarkShipped = pendingShipment !== null
  const showCreateFulfillment =
    paid &&
    fulfillmentItemsPayload.length > 0 &&
    pendingShipment === null &&
    !showCapturePayment
  const labelFulfillmentId = resolveLabelFulfillmentId(order)

  return {
    showCapturePayment,
    showCreateFulfillment,
    showMarkShipped,
    showGenerateLabel: labelFulfillmentId !== null,
    labelFulfillmentId,
    capturablePaymentId,
    unshippedFulfillmentId,
    shipmentItemsPayload,
    fulfillmentItemsPayload,
  }
}
