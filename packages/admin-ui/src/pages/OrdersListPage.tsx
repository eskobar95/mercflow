import { useCallback, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import { ListToolbar } from "@/components/ui/list/ListToolbar"
import { type RowActionItem } from "@/components/ui/list/RowActionsMenu"
import { type ListColumnDef, type ListSelection, type ListSortState } from "@/components/ui/list/types"
import { OrderAdminBadge } from "@/components/orders/OrderAdminBadge"
import {
  ORDER_LIST_SORT_VALUE_GETTERS,
  type OrdersListSortColumn,
} from "@/features/orders/orderListSortValues"
import {
  bulkMarkFulfillmentReady,
  orderListRowEligibleForBulkFulfillment,
} from "@/features/orders/orderListBulkFulfillment"
import {
  PAYMENT_FILTER_OPTIONS,
  type OrderPaymentFilterBucket,
} from "@/features/orders/orderPaymentFilter"
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
  const [paymentBucket, setPaymentBucket] = useState<OrderPaymentFilterBucket>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkMessage, setBulkMessage] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState<ListSortState<OrdersListSortColumn>>({
    column: "createdAt",
    direction: "desc",
  })

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
    paymentBucket,
    dateFrom,
    dateTo,
    page,
    pageSize,
    sort,
  })

  const selection: ListSelection = useMemo(
    () => ({
      selectedIds,
      onSelectAll: (select) => {
        setSelectedIds((prev) => {
          const next = new Set(prev)
          if (select) {
            for (const row of rows) {
              if (orderListRowEligibleForBulkFulfillment(row)) {
                next.add(row.id)
              }
            }
          } else {
            for (const row of rows) {
              next.delete(row.id)
            }
          }
          return next
        })
      },
      onSelectRow: (id, select) => {
        setSelectedIds((prev) => {
          const next = new Set(prev)
          if (select) {
            next.add(id)
          } else {
            next.delete(id)
          }
          return next
        })
      },
    }),
    [rows, selectedIds]
  )

  const selectedRows = useMemo(
    () => rows.filter((r) => selectedIds.has(r.id)),
    [rows, selectedIds]
  )

  const runBulkFulfillment = useCallback(async (): Promise<void> => {
    setBulkLoading(true)
    setBulkMessage(null)
    try {
      const results = await bulkMarkFulfillmentReady(selectedRows)
      const okCount = results.filter((r) => r.ok).length
      const failCount = results.length - okCount
      setBulkMessage(
        failCount === 0
          ? `Created fulfillment for ${okCount} order(s).`
          : `${okCount} succeeded, ${failCount} skipped or failed.`
      )
      refetch()
      setSelectedIds(new Set())
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Bulk fulfillment failed"
      setBulkMessage(msg)
    } finally {
      setBulkLoading(false)
    }
  }, [refetch, selectedRows])

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
            <div className="flex flex-wrap gap-2">
              <Link
                to="/orders/pick-list"
                className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              >
                Pick list
              </Link>
              <button
                type="button"
                className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                onClick={() => {
                  refetch()
                }}
              >
                Refresh
              </button>
            </div>
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
                  setPage(1)
                }}
                placeholder="Order #, customer, email"
                className="min-w-0 rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus"
                aria-label="Search orders"
              />
            </label>
            <label className="flex min-w-[10rem] flex-col gap-1">
              <span className="text-xs font-medium text-content-secondary">Payment</span>
              <select
                value={paymentBucket}
                onChange={(e) => {
                  setPaymentBucket(e.target.value as OrderPaymentFilterBucket)
                  setPage(1)
                }}
                className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus"
                aria-label="Filter by payment status"
              >
                {PAYMENT_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-[10rem] flex-col gap-1">
              <span className="text-xs font-medium text-content-secondary">Status</span>
              <select
                value={statusBucket}
                onChange={(e) => {
                  setStatusBucket(e.target.value as OrderStatusFilterBucket)
                  setPage(1)
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
                  setPage(1)
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
                  setPage(1)
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
        {selectedIds.size > 0 ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle bg-surface-subtle px-4 py-3">
            <span className="text-sm text-content-secondary">
              {selectedIds.size} selected
            </span>
            <Button
              type="button"
              size="sm"
              variant="primary"
              disabled={bulkLoading || selectedRows.length === 0}
              onClick={() => {
                void runBulkFulfillment()
              }}
            >
              {bulkLoading ? "Working…" : "Mark fulfillment-ready"}
            </Button>
            {bulkMessage !== null ? (
              <p className="text-sm text-content-secondary" role="status">
                {bulkMessage}
              </p>
            ) : null}
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
          selection={selection}
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
                    setPaymentBucket("all")
                    setPage(1)
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
