import { useCallback, useMemo, useState } from "react"

import { AddFilterMenu } from "@/components/list-filter/AddFilterMenu"
import { ListFilterBar } from "@/components/list-filter/ListFilterBar"
import { ListPageShell } from "@/components/list-page/ListPageShell"
import { usePageChrome } from "@/components/layout/pageChrome"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import type { SortDirection } from "@/components/ui/list/ListSortControl"
import { ListSortControl } from "@/components/ui/list/ListSortControl"
import { compareSortValues, type ListSortState } from "@/components/ui/list/types"
import { Spinner } from "@/components/ui/Spinner"

import { useAdminSubscriptions } from "@/features/subscriptions"
import { SUBSCRIPTION_FILTER_CATEGORIES } from "@/features/subscriptions/subscriptionFilterCategories"
import {
  SUBSCRIPTION_LIST_COLUMNS,
  SUBSCRIPTION_LIST_SORT_OPTIONS,
  subscriptionMatchesSearch,
  subscriptionMatchesStatusFilter,
  type SubscriptionListSortColumn,
} from "@/features/subscriptions/subscriptionsListColumns"
import { useListFilters } from "@/hooks/useListFilters"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import { cn } from "@/lib/cn"
import { transitionShadowEnter } from "@/lib/motionClasses"

const LIST_PAGE_SIZE = 20

export function SubscriptionsListPage(): JSX.Element {
  const backendConfigured = resolveMedusaAdminBackendUrl() !== null
  const { data, loading, errorMessage, refresh } = useAdminSubscriptions(backendConfigured)

  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<ListSortState<SubscriptionListSortColumn>>({
    column: "renewal",
    direction: "asc",
  })

  const resetPage = useCallback((): void => {
    setPage(1)
  }, [])

  const filters = useListFilters({ onPageReset: resetPage })

  const statusFilter = filters.activeFilters.find((entry) => entry.categoryId === "status")

  const filteredRows = useMemo(() => {
    const rows = data?.data ?? []
    return rows.filter((row) => {
      if (!subscriptionMatchesSearch(row, filters.debouncedSearch)) {
        return false
      }
      if (statusFilter) {
        return subscriptionMatchesStatusFilter(
          row,
          statusFilter.valueIds,
          statusFilter.operator === "is not" ? "is not" : "is",
        )
      }
      return true
    })
  }, [data?.data, filters.debouncedSearch, statusFilter])

  const sortedRows = useMemo(() => {
    if (sort.column === null || sort.direction === "none") {
      return filteredRows
    }
    const column = SUBSCRIPTION_LIST_COLUMNS.find((entry) => entry.id === sort.column)
    if (column?.getSortValue === undefined) {
      return filteredRows
    }
    const direction = sort.direction === "asc" ? 1 : -1
    return [...filteredRows].sort((left, right) => {
      const leftValue = column.getSortValue?.(left)
      const rightValue = column.getSortValue?.(right)
      if (leftValue === undefined || rightValue === undefined) {
        return 0
      }
      return compareSortValues(
        leftValue as string | number | Date,
        rightValue as string | number | Date,
      ) * direction
    })
  }, [filteredRows, sort])

  const pagedRows = useMemo(() => {
    const start = (page - 1) * LIST_PAGE_SIZE
    return sortedRows.slice(start, start + LIST_PAGE_SIZE)
  }, [page, sortedRows])

  const onRequestSort = useCallback((columnId: SubscriptionListSortColumn): void => {
    setSort((previous) => {
      if (previous.column !== columnId) {
        return { column: columnId, direction: "asc" }
      }
      if (previous.direction === "asc") {
        return { column: columnId, direction: "desc" }
      }
      return { column: null, direction: "none" }
    })
    resetPage()
  }, [resetPage])

  const sortControlColumn: SubscriptionListSortColumn = sort.column ?? "renewal"
  const sortControlDirection: SortDirection = sort.direction === "asc" ? "asc" : "desc"

  const onSortControlChange = useCallback(
    (column: SubscriptionListSortColumn, direction: SortDirection): void => {
      setSort({ column, direction })
      resetPage()
    },
    [resetPage],
  )

  const listControls = useMemo(
    () => (
      <>
        <AddFilterMenu
          categories={SUBSCRIPTION_FILTER_CATEGORIES}
          activeFilters={filters.activeFilters}
          onAdd={filters.addFilter}
          onUpdate={filters.updateFilter}
          onSearchSubmit={(value) => {
            filters.setSearchDraft(value)
            resetPage()
          }}
          filterAriaLabel="Filter subscriptions"
        />
        <ListSortControl
          options={SUBSCRIPTION_LIST_SORT_OPTIONS}
          column={sortControlColumn}
          direction={sortControlDirection}
          onChange={onSortControlChange}
        />
        {filters.isSearching ? (
          <span className="ml-0.5 inline-flex items-center" aria-hidden>
            <Spinner size="sm" label="Searching" />
          </span>
        ) : null}
      </>
    ),
    [filters, onSortControlChange, resetPage, sortControlColumn, sortControlDirection],
  )

  const pageChrome = useMemo(
    () => ({
      titleBadge: (
        <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-xs font-semibold tabular-nums text-content-secondary">
          {loading ? "…" : filteredRows.length}
        </span>
      ),
      toolbar: backendConfigured && errorMessage === null ? listControls : null,
      actions: backendConfigured ? (
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-md border border-border-default bg-surface-appCard px-3 text-xs font-medium text-content-secondary transition-colors hover:border-border-strong hover:text-content-primary disabled:opacity-50"
          disabled={loading}
          onClick={() => {
            void refresh()
          }}
        >
          Refresh
        </button>
      ) : null,
    }),
    [backendConfigured, errorMessage, filteredRows.length, listControls, loading, refresh],
  )

  usePageChrome(pageChrome)

  if (!backendConfigured) {
    return (
      <div className="border-b border-border-subtle px-6 py-6 text-sm text-content-secondary">
        Configure{" "}
        <code className="rounded-sm bg-surface-subtle px-1 py-0.5 font-mono text-xs">
          VITE_MEDUSA_ADMIN_BACKEND_URL
        </code>{" "}
        so this view can call the Medusa admin subscription APIs.
      </div>
    )
  }

  return (
    <ListPageShell
      listControls={listControls}
      filterBar={
        <ListFilterBar
          filterCategories={SUBSCRIPTION_FILTER_CATEGORIES}
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
          onClearAll={filters.clearAllFilters}
        />
      }
      footerScrollKey={`${pagedRows.length}:${loading}:${errorMessage ?? ""}`}
      pagination={(footerFloating) => (
        <ListPagination
          aria-label="Subscriptions pagination"
          className={cn(
            "border-t border-border-subtle",
            transitionShadowEnter,
            footerFloating ? "shadow-md" : "shadow-none",
          )}
          currentPage={page}
          pageSize={LIST_PAGE_SIZE}
          totalItems={filteredRows.length}
          onPageChange={setPage}
          onPageSizeChange={() => {}}
          pageSizeOptions={[LIST_PAGE_SIZE]}
        />
      )}
    >
      {errorMessage !== null ? (
        <div className="border-b border-border-subtle px-4 py-4 text-sm text-feedback-danger-content">
          {errorMessage}
        </div>
      ) : null}

      <DataTable
        aria-label="Subscriptions"
        columns={SUBSCRIPTION_LIST_COLUMNS}
        data={pagedRows}
        getRowId={(row) => row.id}
        sortState={sort}
        onRequestSort={onRequestSort}
        hasRowActions={false}
        isLoading={loading && errorMessage === null}
        fillHeight
        emptyState={
          <ListEmptyState
            bare
            title="No subscriptions"
            description="When customers subscribe via the storefront, their subscription rows appear here."
          />
        }
      />
    </ListPageShell>
  )
}
