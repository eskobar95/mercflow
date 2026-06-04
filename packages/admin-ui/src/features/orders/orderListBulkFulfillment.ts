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

export type BulkFulfillmentResult = {
  orderId: string
  displayId: string
  ok: boolean
  message: string
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

  const results: BulkFulfillmentResult[] = []
  for (const row of rows) {
    if (!orderListRowEligibleForBulkFulfillment(row)) {
      results.push({
        orderId: row.id,
        displayId: row.displayId,
        ok: false,
        message: "Order is not paid or already fulfilled.",
      })
      continue
    }
    try {
      const detail = await fetchAdminOrder(row.id)
      const visibility = getOrderFulfillmentActionVisibility(detail)
      if (!visibility.showCreateFulfillment || visibility.fulfillmentItemsPayload.length === 0) {
        results.push({
          orderId: row.id,
          displayId: row.displayId,
          ok: false,
          message: "No remaining items to fulfill for this order.",
        })
        continue
      }
      await postCreateOrderFulfillment(row.id, {
        items: visibility.fulfillmentItemsPayload,
        location_id: locationId,
      })
      results.push({
        orderId: row.id,
        displayId: row.displayId,
        ok: true,
        message: "Fulfillment created.",
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Fulfillment failed"
      results.push({
        orderId: row.id,
        displayId: row.displayId,
        ok: false,
        message: msg,
      })
    }
  }
  return results
}
