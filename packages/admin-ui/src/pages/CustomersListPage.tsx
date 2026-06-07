import { useCallback, useEffect, useMemo, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import { AddFilterMenu } from "@/components/list-filter/AddFilterMenu"
import { ListFilterBar } from "@/components/list-filter/ListFilterBar"
import { ListPageShell } from "@/components/list-page/ListPageShell"
import { usePageChrome } from "@/components/layout/pageChrome"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import type { SortDirection } from "@/components/ui/list/ListSortControl"
import { ListSortControl } from "@/components/ui/list/ListSortControl"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
import { Spinner } from "@/components/ui/Spinner"

import {
  CUSTOMERS_LIST_COLUMNS,
  CUSTOMERS_LIST_SORT_OPTIONS,
} from "@/features/customers/customersListColumns"
import {
  type CustomersDirectoryRow,
  type CustomersDirectorySortCol,
  useCustomersDirectory,
} from "@/features/customers/hooks/useCustomersDirectory"
import { useListFilters } from "@/hooks/useListFilters"

import { cn } from "@/lib/cn"
import { transitionShadowEnter } from "@/lib/motionClasses"

const EMPTY_FILTER_CATEGORIES: never[] = []

type CustomersDirectory = ReturnType<typeof useCustomersDirectory>

function CustomersBackendMissingAlert(): ReactNode {
  return (
    <div className="p-6">
      <section
        className="rounded-lg border border-border-default bg-feedback-warning-subtle px-6 py-5 text-sm text-feedback-warning-content shadow-sm"
        role="alert"
      >
        <h1 className="text-lg font-semibold text-feedback-warning-content">
          Backend URL missing
        </h1>
        <p className="mt-2 leading-relaxed">
          Configure{" "}
          <code className="rounded-sm border border-feedback-warning-border bg-surface-raised px-1 py-0.5 text-xs">
            VITE_MEDUSA_ADMIN_BACKEND_URL
          </code>{" "}
          and, if needed,{" "}
          <code className="rounded-sm border border-feedback-warning-border bg-surface-raised px-1 py-0.5 text-xs">
            VITE_MEDUSA_ADMIN_BEARER_TOKEN
          </code>{" "}
          inside your Vite env so this workspace can authenticate against Medusa Admin.
        </p>
      </section>
    </div>
  )
}

function CustomersListPageContent({ directory }: { directory: CustomersDirectory }): ReactNode {
  const navigate = useNavigate()

  const {
    setSearchInput,
    sortedRows,
    isListLoading,
    listError,
    totalCount,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    sort,
    requestSort,
    applySort,
  } = directory

  const resetPage = useCallback((): void => {
    setCurrentPage(1)
  }, [setCurrentPage])

  const filters = useListFilters({ onPageReset: resetPage, debounceMs: 320 })

  useEffect(() => {
    setSearchInput(filters.debouncedSearch)
  }, [filters.debouncedSearch, setSearchInput])

  const sortControlColumn: CustomersDirectorySortCol = sort.column ?? "name"
  const sortControlDirection: SortDirection = sort.direction === "asc" ? "asc" : "desc"

  const onSortControlChange = useCallback(
    (column: CustomersDirectorySortCol, direction: SortDirection): void => {
      applySort(column, direction)
    },
    [applySort],
  )

  const getRowActions = useCallback(
    (row: CustomersDirectoryRow): RowActionItem[] => [
      {
        id: "detail",
        label: "Open customer",
        onSelect: () => {
          navigate(`/customers/${encodeURIComponent(row.customer.id)}`)
        },
      },
    ],
    [navigate],
  )

  const listControls = useMemo(
    () => (
      <>
        <AddFilterMenu
          categories={EMPTY_FILTER_CATEGORIES}
          activeFilters={filters.activeFilters}
          onAdd={filters.addFilter}
          onUpdate={filters.updateFilter}
          onSearchSubmit={(value) => {
            filters.setSearchDraft(value)
            resetPage()
          }}
          filterAriaLabel="Search customers"
        />
        <ListSortControl
          options={CUSTOMERS_LIST_SORT_OPTIONS}
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
          {isListLoading ? "…" : totalCount}
        </span>
      ),
      toolbar: listControls,
      actions: null,
    }),
    [isListLoading, listControls, totalCount],
  )

  usePageChrome(pageChrome)

  const filterBar = useMemo(
    () => (
      <ListFilterBar
        filterCategories={EMPTY_FILTER_CATEGORIES}
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
    <ListPageShell
      listControls={listControls}
      filterBar={filterBar}
      footerScrollKey={`${sortedRows.length}:${isListLoading}:${listError ?? ""}`}
      pagination={(footerFloating) => (
        <ListPagination
          aria-label="Customer directory pagination"
          className={cn(
            "border-t border-border-subtle",
            transitionShadowEnter,
            footerFloating ? "shadow-md" : "shadow-none",
          )}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalCount}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}
    >
      {listError ? (
        <div
          className="border-b border-feedback-danger-border bg-feedback-danger-subtle px-4 py-3 text-sm text-feedback-danger-content"
          role="alert"
        >
          {listError}
        </div>
      ) : null}

      <DataTable<CustomersDirectoryRow, CustomersDirectorySortCol>
        aria-label="Customer directory"
        caption="MercFlow customer directory backed by Medusa Admin search"
        columns={CUSTOMERS_LIST_COLUMNS}
        data={sortedRows}
        getRowId={(row) => row.customer.id}
        sortState={sort}
        onRequestSort={requestSort}
        getRowActions={getRowActions}
        isLoading={isListLoading}
        hasRowActions
        fillHeight
        emptyState={
          <ListEmptyState
            bare
            title="No customers match"
            description="Try widening your filters or resetting the debounced query — Medusa matches name and email."
            action={
              filters.searchDraft.trim() !== "" ? (
                <button
                  type="button"
                  className="rounded-md border border-border-default bg-surface-raised px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm"
                  onClick={() => filters.clearAllFilters()}
                >
                  Clear search
                </button>
              ) : undefined
            }
          />
        }
      />
    </ListPageShell>
  )
}

export function CustomersListPage(): ReactNode {
  const directory = useCustomersDirectory()

  if (!directory.hasBackendConfiguration) {
    return <CustomersBackendMissingAlert />
  }

  return <CustomersListPageContent directory={directory} />
}
