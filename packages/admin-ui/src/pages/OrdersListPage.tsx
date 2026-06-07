import { useCallback, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { AddFilterMenu } from "@/components/list-filter/AddFilterMenu"
import { ListFilterBar } from "@/components/list-filter/ListFilterBar"
import { ListPageShell } from "@/components/list-page/ListPageShell"
import { OrdersListBulkActions } from "@/components/orders/OrdersListBulkActions"
import { usePageChrome } from "@/components/layout/pageChrome"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListDateRangeControl } from "@/components/ui/list/ListDateRangeControl"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import type { SortDirection } from "@/components/ui/list/ListSortControl"
import { ListSortControl } from "@/components/ui/list/ListSortControl"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
import type { ListSortState } from "@/components/ui/list/types"
import { Spinner } from "@/components/ui/Spinner"

import {
  bulkMarkFulfillmentReady,
  orderListRowEligibleForBulkFulfillment,
} from "@/features/orders/orderListBulkFulfillment"
import {
  deriveOrderFilterBuckets,
  ORDER_FILTER_CATEGORIES,
} from "@/features/orders/orderFilterCategories"
import {
  ORDER_LIST_COLUMNS,
  ORDER_LIST_SORT_OPTIONS,
} from "@/features/orders/orderListColumns"
import type { OrdersListSortColumn } from "@/features/orders/orderListSortValues"
import type { OrderListRow } from "@/features/orders/orderTypes"
import { useListFilters } from "@/hooks/useListFilters"
import { useListRowSelection } from "@/hooks/useListRowSelection"
import { useOrdersList } from "@/hooks/useOrdersList"

import { cn } from "@/lib/cn"
import { transitionShadowEnter } from "@/lib/motionClasses"

export function OrdersListPage(): JSX.Element {
  const navigate = useNavigate()
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkMessage, setBulkMessage] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState<ListSortState<OrdersListSortColumn>>({
    column: "createdAt",
    direction: "desc",
  })

  const resetPage = useCallback((): void => {
    setPage(1)
  }, [])

  const filters = useListFilters({ onPageReset: resetPage, debounceMs: 300 })

  const { statusBucket, paymentBucket } = useMemo(
    () => deriveOrderFilterBuckets(filters.activeFilters),
    [filters.activeFilters],
  )

  const { rows, isLoading, errorMessage, refetch, totalFiltered } = useOrdersList({
    debouncedSearch: filters.debouncedSearch,
    statusBucket,
    paymentBucket,
    dateFrom,
    dateTo,
    page,
    pageSize,
    sort,
  })

  const rowIds = useMemo(() => rows.map((row) => row.id), [rows])
  const bulkEligibleRowIds = useMemo(
    () => rows.filter(orderListRowEligibleForBulkFulfillment).map((row) => row.id),
    [rows],
  )

  const { selectedIds, selection, clearSelection } = useListRowSelection(
    rowIds,
    [page, filters.debouncedSearch, statusBucket, paymentBucket, dateFrom, dateTo, sort],
    {
      selectAllIds: bulkEligibleRowIds,
      selectAllMerge: true,
      deselectAllPageScoped: true,
    },
  )

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.has(row.id)),
    [rows, selectedIds],
  )

  const onRequestSort = useCallback((columnId: OrdersListSortColumn): void => {
    setSort((previous) => {
      if (previous.column !== columnId) {
        return { column: columnId, direction: "asc" }
      }
      if (previous.direction === "asc") {
        return { column: columnId, direction: "desc" }
      }
      if (previous.direction === "desc") {
        return { column: null, direction: "none" }
      }
      return { column: columnId, direction: "asc" }
    })
    resetPage()
  }, [resetPage])

  const sortControlColumn: OrdersListSortColumn = sort.column ?? "createdAt"
  const sortControlDirection: SortDirection = sort.direction === "asc" ? "asc" : "desc"

  const onSortControlChange = useCallback(
    (column: OrdersListSortColumn, direction: SortDirection): void => {
      setSort({ column, direction })
      resetPage()
    },
    [resetPage],
  )

  const runBulkFulfillment = useCallback(async (): Promise<void> => {
    setBulkLoading(true)
    setBulkMessage(null)
    try {
      const results = await bulkMarkFulfillmentReady(selectedRows)
      const okCount = results.filter((result) => result.ok).length
      const failCount = results.length - okCount
      setBulkMessage(
        failCount === 0
          ? `Created fulfillment for ${okCount} order(s).`
          : `${okCount} succeeded, ${failCount} skipped or failed.`,
      )
      refetch()
      clearSelection()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bulk fulfillment failed"
      setBulkMessage(message)
    } finally {
      setBulkLoading(false)
    }
  }, [clearSelection, refetch, selectedRows])

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
    [navigate],
  )

  const resetAllFilters = useCallback((): void => {
    filters.clearAllFilters()
    setDateFrom("")
    setDateTo("")
  }, [filters])

  const listControls = useMemo(
    () => (
      <>
        <AddFilterMenu
          categories={ORDER_FILTER_CATEGORIES}
          activeFilters={filters.activeFilters}
          onAdd={filters.addFilter}
          onUpdate={filters.updateFilter}
          onSearchSubmit={(value) => {
            filters.setSearchDraft(value)
            resetPage()
          }}
          filterAriaLabel="Filter orders"
        />
        <ListSortControl
          options={ORDER_LIST_SORT_OPTIONS}
          column={sortControlColumn}
          direction={sortControlDirection}
          onChange={onSortControlChange}
        />
        <ListDateRangeControl
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={(value) => {
            setDateFrom(value)
            resetPage()
          }}
          onDateToChange={(value) => {
            setDateTo(value)
            resetPage()
          }}
        />
        {filters.isSearching ? (
          <span className="ml-0.5 inline-flex items-center" aria-hidden>
            <Spinner size="sm" label="Searching" />
          </span>
        ) : null}
      </>
    ),
    [
      filters,
      sortControlColumn,
      sortControlDirection,
      onSortControlChange,
      dateFrom,
      dateTo,
      resetPage,
    ],
  )

  const pageChrome = useMemo(
    () => ({
      titleBadge: (
        <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-xs font-semibold tabular-nums text-content-secondary">
          {isLoading ? "…" : totalFiltered}
        </span>
      ),
      toolbar: listControls,
      actions: (
        <>
          <Link
            to="/orders/pick-list"
            className="inline-flex h-8 items-center rounded-md border border-border-default bg-surface-appCard px-3 text-xs font-medium text-content-secondary transition-colors hover:border-border-strong hover:text-content-primary"
          >
            Pick list
          </Link>
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-md border border-border-default bg-surface-appCard px-3 text-xs font-medium text-content-secondary transition-colors hover:border-border-strong hover:text-content-primary"
            onClick={() => refetch()}
          >
            Refresh
          </button>
        </>
      ),
    }),
    [isLoading, listControls, refetch, totalFiltered],
  )

  usePageChrome(pageChrome)

  const emptyState = (
    <ListEmptyState
      bare
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
          onClick={resetAllFilters}
        >
          Reset filters
        </button>
      }
    />
  )

  return (
    <ListPageShell
      listControls={listControls}
      filterBar={
        <ListFilterBar
          filterCategories={ORDER_FILTER_CATEGORIES}
          hasChips={filters.hasChips}
          searchDraft={filters.searchDraft}
          activeFilters={filters.activeFilters}
          onClearSearch={() => {
            filters.setSearchDraft("")
            resetPage()
          }}
          onOperatorChange={(categoryId, operator) =>
            filters.updateFilter(categoryId, { operator })
          }
          onValueToggle={filters.toggleFilterValue}
          onRemoveFilter={filters.removeFilter}
          onClearAll={() => {
            filters.clearAllFilters()
            setDateFrom("")
            setDateTo("")
          }}
        />
      }
      footerScrollKey={`${rows.length}:${isLoading}:${errorMessage ?? ""}`}
      pagination={(footerFloating) => (
        <ListPagination
          aria-label="Orders list pagination"
          className={cn(
            "border-t border-border-subtle",
            transitionShadowEnter,
            footerFloating ? "shadow-md" : "shadow-none",
          )}
          currentPage={page}
          pageSize={pageSize}
          totalItems={totalFiltered}
          onPageChange={setPage}
          onPageSizeChange={(next) => {
            setPageSize(next)
            setPage(1)
          }}
        />
      )}
      bulkActions={
        <OrdersListBulkActions
          selectedCount={selectedIds.size}
          bulkLoading={bulkLoading}
          bulkMessage={bulkMessage}
          onClearSelection={clearSelection}
          onMarkFulfillmentReady={() => {
            void runBulkFulfillment()
          }}
        />
      }
    >
      {errorMessage !== null ? (
        <div className="border-b border-border-subtle px-4 py-4">
          <p className="text-sm text-content-danger" role="alert">
            {errorMessage}
          </p>
          <button
            type="button"
            className="mt-2 rounded-md border border-border-default bg-surface-raised px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      ) : null}

      <DataTable<OrderListRow, OrdersListSortColumn>
        aria-label="Orders list"
        columns={ORDER_LIST_COLUMNS}
        data={rows}
        getRowId={(row) => row.id}
        sortState={sort}
        onRequestSort={onRequestSort}
        getRowActions={getRowActions}
        selection={selection}
        isLoading={isLoading && errorMessage === null}
        hasRowActions
        emptyState={emptyState}
        fillHeight
      />
    </ListPageShell>
  )
}
