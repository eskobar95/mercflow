import { useMemo, type ReactNode } from "react"
import { Link } from "react-router-dom"

import { AddFilterMenu } from "@/components/list-filter/AddFilterMenu"
import { ListFilterBar } from "@/components/list-filter/ListFilterBar"
import { ListPageShell } from "@/components/list-page/ListPageShell"
import { OrdersListBulkActions } from "@/components/orders/OrdersListBulkActions"
import { usePageChrome } from "@/components/layout/pageChrome"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListDateRangeControl } from "@/components/ui/list/ListDateRangeControl"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import { ListSortControl } from "@/components/ui/list/ListSortControl"
import { Spinner } from "@/components/ui/Spinner"

import {
  ORDER_FILTER_CATEGORIES,
} from "@/features/orders/orderFilterCategories"
import {
  createOrderListColumns,
  ORDER_LIST_SORT_OPTIONS,
} from "@/features/orders/orderListColumns"
import type { OrdersListSortColumn } from "@/features/orders/orderListSortValues"
import type { OrderListRow } from "@/features/orders/orderTypes"
import type { OrdersListPageModel } from "@/hooks/orders/useOrdersListPageModel"

import { cn } from "@/lib/cn"
import { transitionShadowEnter } from "@/lib/motionClasses"

type OrdersListPageViewProps = {
  model: OrdersListPageModel
}

export function OrdersListPageView({ model }: OrdersListPageViewProps): ReactNode {
  const {
    filters,
    rows,
    isLoading,
    errorMessage,
    refetch,
    totalFiltered,
    selectedIds,
    selection,
    clearSelection,
    ui,
    setPage,
    setPageSize,
    setDateFrom,
    setDateTo,
    onRequestSort,
    onSortControlChange,
    runBulkFulfillment,
    getRowActions,
    buildOrderDetailPath,
    resetAllFilters,
    clearFilterDates,
    sortControlColumn,
    sortControlDirection,
    resetPage,
  } = model

  const columns = useMemo(
    () => createOrderListColumns(buildOrderDetailPath),
    [buildOrderDetailPath],
  )

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
          dateFrom={ui.dateFrom}
          dateTo={ui.dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
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
      onSortControlChange,
      resetPage,
      setDateFrom,
      setDateTo,
      sortControlColumn,
      sortControlDirection,
      ui.dateFrom,
      ui.dateTo,
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

  const filterBar = useMemo(
    () => (
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
          clearFilterDates()
        }}
      />
    ),
    [
      clearFilterDates,
      filters.activeFilters,
      filters.clearAllFilters,
      filters.hasChips,
      filters.removeFilter,
      filters.searchDraft,
      filters.setSearchDraft,
      filters.toggleFilterValue,
      filters.updateFilter,
      resetPage,
    ],
  )

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
      filterBar={filterBar}
      footerScrollKey={`${rows.length}:${isLoading}:${errorMessage ?? ""}`}
      pagination={(footerFloating) => (
        <ListPagination
          aria-label="Orders list pagination"
          className={cn(
            "border-t border-border-subtle",
            transitionShadowEnter,
            footerFloating ? "shadow-md" : "shadow-none",
          )}
          currentPage={ui.page}
          pageSize={ui.pageSize}
          totalItems={totalFiltered}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
      bulkActions={
        <OrdersListBulkActions
          selectedCount={selectedIds.size}
          bulkLoading={ui.bulkLoading}
          bulkMessage={ui.bulkMessage}
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
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        sortState={ui.sort}
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
