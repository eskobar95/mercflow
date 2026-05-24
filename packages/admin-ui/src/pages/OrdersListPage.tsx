import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import { ListToolbar } from "@/components/ui/list/ListToolbar"
import { type RowActionItem } from "@/components/ui/list/RowActionsMenu"
import { type ListColumnDef, type ListSortState } from "@/components/ui/list/types"
import { OrderAdminBadge } from "@/components/orders/OrderAdminBadge"
import {
  ORDER_LIST_SORT_VALUE_GETTERS,
  type OrdersListSortColumn,
} from "@/features/orders/orderListSortValues"
import type { OrderListRow, OrderStatusFilterBucket } from "@/features/orders/orderTypes"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useOrdersList } from "@/hooks/useOrdersList"
import { formatAdminCurrency } from "@/utils/formatAdminCurrency"

const STATUS_OPTIONS: { value: OrderStatusFilterBucket; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
]

const ORDER_COLUMNS: ListColumnDef<OrderListRow, OrdersListSortColumn>[] = [
  {
    id: "displayId",
    header: "Order #",
    sortable: true,
    cellClassName: "font-medium",
    getSortValue: ORDER_LIST_SORT_VALUE_GETTERS.displayId,
    renderCell: (r) => (
      <Link
        to={`/orders/${encodeURIComponent(r.id)}`}
        className="text-interactive-primary hover:text-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
      >
        #{r.displayId}
      </Link>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    sortable: true,
    getSortValue: ORDER_LIST_SORT_VALUE_GETTERS.customer,
    renderCell: (r) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{r.customerName}</span>
        <span className="truncate text-xs text-content-tertiary">{r.customerEmail}</span>
      </div>
    ),
  },
  {
    id: "createdAt",
    header: "Date",
    sortable: true,
    getSortValue: ORDER_LIST_SORT_VALUE_GETTERS.createdAt,
    renderCell: (r) => (
      <time dateTime={r.createdAt} className="text-content-secondary">
        {new Date(r.createdAt).toLocaleString("da-DK", {
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
    renderCell: (r) => <OrderAdminBadge value={r.paymentStatus} />,
  },
  {
    id: "fulfillmentStatus",
    header: "Fulfillment",
    sortable: true,
    getSortValue: ORDER_LIST_SORT_VALUE_GETTERS.fulfillmentStatus,
    renderCell: (r) => <OrderAdminBadge value={r.fulfillmentStatus} />,
  },
  {
    id: "total",
    header: "Total",
    sortable: true,
    getSortValue: ORDER_LIST_SORT_VALUE_GETTERS.total,
    renderCell: (r) => (
      <span className="tabular-nums">{formatAdminCurrency(r.totalMinor, r.currencyCode)}</span>
    ),
  },
]

export function OrdersListPage(): JSX.Element {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusBucket, setStatusBucket] = useState<OrderStatusFilterBucket>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState<ListSortState<OrdersListSortColumn>>({
    column: "createdAt",
    direction: "desc",
  })

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusBucket, dateFrom, dateTo])

  const onRequestSort = useCallback((columnId: OrdersListSortColumn): void => {
    setSort((s) => {
      if (s.column !== columnId) {
        return { column: columnId, direction: "asc" }
      }
      if (s.direction === "asc") {
        return { column: columnId, direction: "desc" }
      }
      if (s.direction === "desc") {
        return { column: null, direction: "none" }
      }
      return { column: columnId, direction: "asc" }
    })
  }, [])

  const { rows, isLoading, errorMessage, refetch, totalFiltered } = useOrdersList({
    debouncedSearch,
    statusBucket,
    dateFrom,
    dateTo,
    page,
    pageSize,
    sort,
  })

  const getRowActions = useCallback(
    (row: OrderListRow): RowActionItem[] => [
      {
        id: "view",
        label: "View",
        onSelect: () => {
          navigate(`/orders/${encodeURIComponent(row.id)}`)
        },
      },
    ],
    [navigate]
  )

  return (
    <div className="p-6">
      <div className="overflow-hidden rounded-lg border border-border-default bg-surface-default shadow-sm">
        <ListToolbar
          title="Orders"
          description="Store orders from Medusa Admin API (read-only list)."
          end={
            <button
              type="button"
              className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              onClick={() => {
                refetch()
              }}
            >
              Refresh
            </button>
          }
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-4">
            <label className="flex min-w-[12rem] max-w-sm flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-content-secondary">Search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                }}
                placeholder="Order #, customer, email"
                className="min-w-0 rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus"
                aria-label="Search orders"
              />
            </label>
            <label className="flex min-w-[10rem] flex-col gap-1">
              <span className="text-xs font-medium text-content-secondary">Status</span>
              <select
                value={statusBucket}
                onChange={(e) => {
                  setStatusBucket(e.target.value as OrderStatusFilterBucket)
                }}
                className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus"
                aria-label="Filter by order status bucket"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-[10rem] flex-col gap-1">
              <span className="text-xs font-medium text-content-secondary">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                }}
                className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus"
                aria-label="Created on or after"
              />
            </label>
            <label className="flex min-w-[10rem] flex-col gap-1">
              <span className="text-xs font-medium text-content-secondary">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                }}
                className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus"
                aria-label="Created on or before"
              />
            </label>
          </div>
        </ListToolbar>
        {errorMessage !== null ? (
          <div className="border-t border-border-subtle px-4 py-4">
            <p className="text-sm text-content-danger" role="alert">
              {errorMessage}
            </p>
            <button
              type="button"
              className="mt-2 rounded-md border border-border-default bg-surface-raised px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              onClick={() => {
                refetch()
              }}
            >
              Retry
            </button>
          </div>
        ) : null}
        <DataTable<OrderListRow, OrdersListSortColumn>
          aria-label="Orders list"
          caption="Orders"
          columns={ORDER_COLUMNS}
          data={rows}
          getRowId={(r) => r.id}
          sortState={sort}
          onRequestSort={onRequestSort}
          getRowActions={getRowActions}
          isLoading={isLoading && errorMessage === null}
          emptyState={
            <ListEmptyState
              title="No orders to show"
              description={
                isLoading && errorMessage === null
                  ? "Loading…"
                  : "Try adjusting filters or widen the created date range. Up to roughly 800 recent orders load for grouping and filtering in this slice."
              }
              action={
                <button
                  type="button"
                  className="rounded-md border border-border-default bg-surface-raised px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm"
                  onClick={() => {
                    setSearch("")
                    setDateFrom("")
                    setDateTo("")
                    setStatusBucket("all")
                  }}
                >
                  Reset filters
                </button>
              }
            />
          }
        />
        <ListPagination
          aria-label="Orders list pagination"
          currentPage={page}
          pageSize={pageSize}
          totalItems={totalFiltered}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n)
            setPage(1)
          }}
        />
      </div>
    </div>
  )
}
