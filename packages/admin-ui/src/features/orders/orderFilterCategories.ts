import type { ActiveFilter, FilterCategory } from "@/components/list-filter/types"
import {
  PAYMENT_FILTER_OPTIONS,
  type OrderPaymentFilterBucket,
} from "@/features/orders/orderPaymentFilter"
import type { OrderStatusFilterBucket } from "@/features/orders/orderTypes"

const STATUS_FILTER_VALUES: FilterCategory["values"] = [
  { id: "pending", label: "Pending", tone: "warning" },
  { id: "processing", label: "Processing", tone: "accent" },
  { id: "shipped", label: "Shipped", tone: "success" },
  { id: "delivered", label: "Delivered", tone: "success" },
  { id: "cancelled", label: "Cancelled", tone: "danger" },
]

const PAYMENT_FILTER_VALUES: FilterCategory["values"] = ((): FilterCategory["values"] => {
  const values: FilterCategory["values"] = []
  for (const option of PAYMENT_FILTER_OPTIONS) {
    if (option.value !== "all") {
      values.push({ id: option.value, label: option.label })
    }
  }
  return values
})()

export const ORDER_FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: "payment",
    label: "Payment",
    type: "enum",
    operators: ["is", "is not"],
    values: PAYMENT_FILTER_VALUES,
  },
  {
    id: "status",
    label: "Status",
    type: "enum",
    operators: ["is", "is not"],
    values: STATUS_FILTER_VALUES,
  },
]

function isOrderStatusBucket(value: string): value is Exclude<OrderStatusFilterBucket, "all"> {
  return STATUS_FILTER_VALUES.some((entry) => entry.id === value)
}

function isOrderPaymentBucket(value: string): value is Exclude<OrderPaymentFilterBucket, "all"> {
  return PAYMENT_FILTER_OPTIONS.some((option) => option.value === value && option.value !== "all")
}

function deriveSingleBucket<T extends string>(
  filters: ActiveFilter[],
  categoryId: string,
  isValid: (value: string) => value is T,
): T | "all" {
  const filter = filters.find((entry) => entry.categoryId === categoryId)
  if (!filter || filter.valueIds.length !== 1 || filter.operator !== "is") {
    return "all"
  }
  const value = filter.valueIds[0]
  if (value === undefined || !isValid(value)) {
    return "all"
  }
  return value
}

export function deriveOrderFilterBuckets(filters: ActiveFilter[]): {
  statusBucket: OrderStatusFilterBucket
  paymentBucket: OrderPaymentFilterBucket
} {
  return {
    statusBucket: deriveSingleBucket(filters, "status", isOrderStatusBucket),
    paymentBucket: deriveSingleBucket(filters, "payment", isOrderPaymentBucket),
  }
}
