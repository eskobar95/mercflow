import { useCallback, useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import { AddFilterMenu } from "@/components/list-filter/AddFilterMenu"
import { ListFilterBar } from "@/components/list-filter/ListFilterBar"
import { ListPageShell } from "@/components/list-page/ListPageShell"
import { usePageChrome } from "@/components/layout/pageChrome"
import { SubscriptionCancelDialog } from "@/components/subscriptions/SubscriptionCancelDialog"
import { SubscriptionPauseDialog } from "@/components/subscriptions/SubscriptionPauseDialog"
import { DataTable } from "@/components/ui/list/DataTable"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import type { SortDirection } from "@/components/ui/list/ListSortControl"
import { ListSortControl } from "@/components/ui/list/ListSortControl"
import { compareSortValues, type ListSortState } from "@/components/ui/list/types"
import { Spinner } from "@/components/ui/Spinner"

import { applyOptimisticSubscriptionStatus } from "@/features/subscriptions/applyOptimisticSubscriptionStatus"
import { useAdminSubscriptions } from "@/features/subscriptions"
import { SUBSCRIPTION_FILTER_CATEGORIES } from "@/features/subscriptions/subscriptionFilterCategories"
import {
  subscriptionCanCancel,
  subscriptionCanPause,
  subscriptionCanResume,
} from "@/features/subscriptions/subscriptionUi"
import {
  SUBSCRIPTION_LIST_COLUMNS,
  SUBSCRIPTION_LIST_SORT_OPTIONS,
  subscriptionMatchesSearch,
  subscriptionMatchesStatusFilter,
  type SubscriptionListSortColumn,
} from "@/features/subscriptions/subscriptionsListColumns"
import type { AdminSubscriptionRow } from "@/features/subscriptions/types"
import { useSubscriptionStatusActions } from "@/features/subscriptions/useSubscriptionStatusActions"
import { useListFilters } from "@/hooks/useListFilters"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import { cn } from "@/lib/cn"
import { transitionShadowEnter } from "@/lib/motionClasses"

const LIST_PAGE_SIZE = 20

function SubscriptionsBackendMissingNotice(): ReactNode {
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

function SubscriptionsListPageContent(): ReactNode {
  const navigate = useNavigate()
  const { data, loading, errorMessage, refresh, replaceRow } = useAdminSubscriptions(true)

  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<ListSortState<SubscriptionListSortColumn>>({
    column: "renewal",
    direction: "asc",
  })
  const [pauseTarget, setPauseTarget] = useState<AdminSubscriptionRow | null>(null)
  const [cancelTarget, setCancelTarget] = useState<AdminSubscriptionRow | null>(null)

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
    return filteredRows.slice().sort((left, right) => {
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

  const onOptimisticStatus = useCallback(
    (subscriptionId: string, status: string): void => {
      const row = data?.data.find((entry) => entry.id === subscriptionId)
      if (row === undefined) {
        return
      }
      replaceRow(applyOptimisticSubscriptionStatus(row, status))
    },
    [data?.data, replaceRow]
  )

  const onRevert = useCallback((): void => {
    void refresh()
  }, [refresh])

  const { actionError, isMutating, clearActionError, pause, cancel, resume } =
    useSubscriptionStatusActions({
      onOptimisticStatus,
      onConfirmedUpdate: replaceRow,
      onRevert,
    })

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

  const getRowActions = useCallback(
    (row: AdminSubscriptionRow): RowActionItem[] => {
      const actions: RowActionItem[] = [
        {
          id: "view",
          label: "View details",
          onSelect: () => {
            navigate(`/subscriptions/${encodeURIComponent(row.id)}`)
          },
        },
      ]
      if (subscriptionCanResume(row.status)) {
        actions.push({
          id: "resume",
          label: "Resume",
          onSelect: () => {
            clearActionError()
            void resume(row.id)
          },
        })
      }
      if (subscriptionCanPause(row.status)) {
        actions.push({
          id: "pause",
          label: "Pause",
          onSelect: () => {
            clearActionError()
            setPauseTarget(row)
          },
        })
      }
      if (subscriptionCanCancel(row.status)) {
        actions.push({
          id: "cancel",
          label: "Cancel",
          destructive: true,
          onSelect: () => {
            clearActionError()
            setCancelTarget(row)
          },
        })
      }
      return actions
    },
    [clearActionError, navigate, resume]
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
      toolbar: errorMessage === null ? listControls : null,
      actions: (
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
      ),
    }),
    [errorMessage, filteredRows.length, listControls, loading, refresh],
  )

  usePageChrome(pageChrome)

  const filterBar = useMemo(
    () => (
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
    ),
    [
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

  return (
    <>
      <ListPageShell
        listControls={listControls}
        filterBar={filterBar}
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

        {actionError !== null ? (
          <div className="border-b border-border-subtle px-4 py-3 text-sm text-feedback-danger-content">
            {actionError}
          </div>
        ) : null}

        <DataTable
          aria-label="Subscriptions"
          columns={SUBSCRIPTION_LIST_COLUMNS}
          data={pagedRows}
          getRowId={(row) => row.id}
          sortState={sort}
          onRequestSort={onRequestSort}
          getRowActions={getRowActions}
          hasRowActions
          isLoading={loading && errorMessage === null}
          fillHeight
          onRowClick={(row) => {
            navigate(`/subscriptions/${encodeURIComponent(row.id)}`)
          }}
          emptyState={
            <ListEmptyState
              bare
              title="No subscriptions"
              description="When customers subscribe via the storefront, their subscription rows appear here."
            />
          }
        />
      </ListPageShell>

      <SubscriptionPauseDialog
        open={pauseTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPauseTarget(null)
          }
        }}
        productLabel={pauseTarget?.product_label ?? null}
        isSubmitting={isMutating}
        onConfirm={(resumeDate) => {
          if (pauseTarget === null) {
            return
          }
          void (async (): Promise<void> => {
            const ok = await pause(pauseTarget.id, resumeDate)
            if (ok) {
              setPauseTarget(null)
            }
          })()
        }}
      />

      <SubscriptionCancelDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null)
          }
        }}
        productLabel={cancelTarget?.product_label ?? null}
        isSubmitting={isMutating}
        onConfirm={() => {
          if (cancelTarget === null) {
            return
          }
          void (async (): Promise<void> => {
            const ok = await cancel(cancelTarget.id)
            if (ok) {
              setCancelTarget(null)
            }
          })()
        }}
      />
    </>
  )
}

export function SubscriptionsListPage(): ReactNode {
  if (resolveMedusaAdminBackendUrl() === null) {
    return <SubscriptionsBackendMissingNotice />
  }

  return <SubscriptionsListPageContent />
}
