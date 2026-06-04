import type { OrderListRow, OrderStatusFilterBucket } from "@/features/orders/orderTypes"

function lc(s: string): string {
  return s.trim().toLowerCase()
}

/**
 * Maps high-level admin buckets to fields on `OrderListRow`.
 * API spelling uses American "canceled"; UI may show "Cancelled".
 */
export function orderMatchesStatusBucket(
  row: OrderListRow,
  bucket: OrderStatusFilterBucket
): boolean {
  if (bucket === "all") {
    return true
  }
  const orderStatus = lc(row.orderStatus)
  const pay = lc(row.paymentStatus)
  const fulfill = lc(row.fulfillmentStatus)
  switch (bucket) {
    case "pending":
      return orderStatus === "pending"
    case "cancelled":
      return orderStatus === "canceled" || orderStatus === "cancelled"
    case "delivered":
      return fulfill === "delivered" || fulfill === "partially_delivered"
    case "shipped":
      return fulfill === "shipped" || fulfill === "partially_shipped"
    case "processing":
      return (
        pay === "captured" &&
        (fulfill === "not_fulfilled" || fulfill === "partially_fulfilled")
      )
    default:
      return true
  }
}
