import { fetchAdminOrder } from "@/features/orders/ordersAdminApi"
import {
  fetchFirstStockLocationId,
  postCreateOrderFulfillment,
} from "@/features/orders/orderFulfillmentAdminApi"
import { getOrderFulfillmentActionVisibility } from "@/features/orders/orderFulfillmentActionState"
import type { OrderListRow } from "@/features/orders/orderTypes"

const PAID_STATUSES = new Set([
  "captured",
  "partially_captured",
  "partially_refunded",
  "paid",
])

export function orderListRowEligibleForBulkFulfillment(row: OrderListRow): boolean {
  const pay = row.paymentStatus.trim().toLowerCase()
  if (!PAID_STATUSES.has(pay)) {
    return false
  }
  const fulfill = row.fulfillmentStatus.trim().toLowerCase()
  return fulfill === "not_fulfilled" || fulfill === "partially_fulfilled"
}

type BulkFulfillmentResult = {
  orderId: string
  displayId: string
  ok: boolean
  message: string
}

async function fulfillSingleOrder(
  row: OrderListRow,
  locationId: string,
): Promise<BulkFulfillmentResult> {
  if (!orderListRowEligibleForBulkFulfillment(row)) {
    return {
      orderId: row.id,
      displayId: row.displayId,
      ok: false,
      message: "Order is not paid or already fulfilled.",
    }
  }

  try {
    const detail = await fetchAdminOrder(row.id)
    const visibility = getOrderFulfillmentActionVisibility(detail)
    if (!visibility.showCreateFulfillment || visibility.fulfillmentItemsPayload.length === 0) {
      return {
        orderId: row.id,
        displayId: row.displayId,
        ok: false,
        message: "No remaining items to fulfill for this order.",
      }
    }

    await postCreateOrderFulfillment(row.id, {
      items: visibility.fulfillmentItemsPayload,
      location_id: locationId,
    })

    return {
      orderId: row.id,
      displayId: row.displayId,
      ok: true,
      message: "Fulfillment created.",
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fulfillment failed"
    return {
      orderId: row.id,
      displayId: row.displayId,
      ok: false,
      message,
    }
  }
}

/**
 * Creates Medusa fulfillments for each eligible selected order (fulfillment-ready).
 */
export async function bulkMarkFulfillmentReady(
  rows: OrderListRow[]
): Promise<BulkFulfillmentResult[]> {
  const locationId = await fetchFirstStockLocationId()
  if (locationId === null) {
    throw new Error(
      "No stock location is available. Create a stock location in Medusa before bulk fulfillment."
    )
  }

  return Promise.all(rows.map((row) => fulfillSingleOrder(row, locationId)))
}
