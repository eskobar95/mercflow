import type { OrderListRow } from "@/features/orders/orderTypes"

export type OrderPaymentFilterBucket =
  | "all"
  | "not_paid"
  | "awaiting"
  | "captured"
  | "refunded"

export const PAYMENT_FILTER_OPTIONS: { value: OrderPaymentFilterBucket; label: string }[] = [
  { value: "all", label: "All payments" },
  { value: "not_paid", label: "Not paid" },
  { value: "awaiting", label: "Awaiting" },
  { value: "captured", label: "Captured" },
  { value: "refunded", label: "Refunded" },
]

export function orderMatchesPaymentBucket(
  row: OrderListRow,
  bucket: OrderPaymentFilterBucket
): boolean {
  if (bucket === "all") {
    return true
  }
  const pay = row.paymentStatus.trim().toLowerCase()
  switch (bucket) {
    case "not_paid":
      return pay === "not_paid" || pay === "awaiting" || pay === "authorized"
    case "awaiting":
      return pay === "awaiting" || pay === "authorized"
    case "captured":
      return (
        pay === "captured" ||
        pay === "partially_captured" ||
        pay === "partially_refunded" ||
        pay === "paid"
      )
    case "refunded":
      return pay === "refunded" || pay === "partially_refunded"
    default:
      return true
  }
}
