import { Link } from "react-router-dom"

import { OrderAdminBadge } from "@/components/orders/OrderAdminBadge"
import type { SortOption } from "@/components/ui/list/ListSortControl"
import type { ListColumnDef } from "@/components/ui/list/types"
import {
  ORDER_LIST_SORT_VALUE_GETTERS,
  type OrdersListSortColumn,
} from "@/features/orders/orderListSortValues"
import type { OrderListRow } from "@/features/orders/orderTypes"
import { formatAdminCurrency } from "@/utils/formatAdminCurrency"

export const ORDER_LIST_SORT_OPTIONS: SortOption<OrdersListSortColumn>[] = [
  { id: "displayId", label: "Order #" },
  { id: "customer", label: "Customer" },
  { id: "createdAt", label: "Date" },
  { id: "paymentStatus", label: "Payment" },
  { id: "fulfillmentStatus", label: "Fulfillment" },
  { id: "total", label: "Total" },
]

export function createOrderListColumns(
  buildOrderDetailPath: (orderId: string) => string,
): ListColumnDef<OrderListRow, OrdersListSortColumn>[] {
  return [
  {
    id: "displayId",
    header: "Order #",
    sortable: true,
    cellClassName: "font-medium",
    getSortValue: ORDER_LIST_SORT_VALUE_GETTERS.displayId,
    renderCell: (row) => (
      <Link
        to={buildOrderDetailPath(row.id)}
        className="text-interactive-primary hover:text-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
      >
        #{row.displayId}
      </Link>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    sortable: true,
    getSortValue: ORDER_LIST_SORT_VALUE_GETTERS.customer,
    renderCell: (row) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{row.customerName}</span>
        <span className="truncate text-xs text-content-tertiary">{row.customerEmail}</span>
      </div>
    ),
  },
  {
    id: "createdAt",
    header: "Date",
    sortable: true,
    getSortValue: ORDER_LIST_SORT_VALUE_GETTERS.createdAt,
    renderCell: (row) => (
      <time dateTime={row.createdAt} className="text-content-secondary">
        {new Date(row.createdAt).toLocaleString("da-DK", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </time>
    ),
  },
  {
    id: "paymentStatus",
    header: "Payment",
    sortable: true,
    getSortValue: ORDER_LIST_SORT_VALUE_GETTERS.paymentStatus,
    renderCell: (row) => <OrderAdminBadge value={row.paymentStatus} />,
  },
  {
    id: "fulfillmentStatus",
    header: "Fulfillment",
    sortable: true,
    getSortValue: ORDER_LIST_SORT_VALUE_GETTERS.fulfillmentStatus,
    renderCell: (row) => <OrderAdminBadge value={row.fulfillmentStatus} />,
  },
  {
    id: "total",
    header: "Total",
    sortable: true,
    align: "right",
    getSortValue: ORDER_LIST_SORT_VALUE_GETTERS.total,
    renderCell: (row) => (
      <span className="tabular-nums">{formatAdminCurrency(row.totalMinor, row.currencyCode)}</span>
    ),
  },
]
}
