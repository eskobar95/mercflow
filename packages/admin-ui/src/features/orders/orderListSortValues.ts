import type { OrderListRow } from "./orderTypes"

export type OrdersListSortColumn =
  | "displayId"
  | "customer"
  | "createdAt"
  | "paymentStatus"
  | "fulfillmentStatus"
  | "total"

export const ORDER_LIST_SORT_VALUE_GETTERS: {
  [K in OrdersListSortColumn]: (row: OrderListRow) => string | number | Date
} = {
  displayId: (row) => Number.parseInt(row.displayId, 10) || 0,
  customer: (row) => `${row.customerName} ${row.customerEmail}`,
  createdAt: (row) => new Date(row.createdAt),
  paymentStatus: (row) => row.paymentStatus,
  fulfillmentStatus: (row) => row.fulfillmentStatus,
  total: (row) => row.totalMinor,
}
