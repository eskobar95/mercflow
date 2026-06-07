import { useCallback, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { AddFilterMenu } from "@/components/list-filter/AddFilterMenu"
import { ListFilterBar } from "@/components/list-filter/ListFilterBar"
import { ListPageShell } from "@/components/list-page/ListPageShell"
import { PRODUCT_FILTER_CATEGORIES } from "@/components/product-list/filter/productFilters"
import { ProductCardGrid } from "@/components/product-list/ProductCardGrid"
import { ProductCatalogBulkActions } from "@/components/product-list/ProductCatalogBulkActions"
import {
  PRODUCT_CATALOG_COLUMNS,
  PRODUCT_CATALOG_SORT_OPTIONS,
  SORTABLE_PRODUCT_COLUMNS,
  type ProductColumnId,
} from "@/components/product-list/productCatalogColumns"
import { usePageChrome } from "@/components/layout/pageChrome"
import { IconButton } from "@/components/ui/IconButton"
import { IconCategories, IconPlus } from "@/components/ui/icons"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import type { SortDirection } from "@/components/ui/list/ListSortControl"
import { ListSortControl } from "@/components/ui/list/ListSortControl"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
import type { ListSortState } from "@/components/ui/list/types"
import { Spinner } from "@/components/ui/Spinner"
import { useToast } from "@/components/ui/Toast"
import type { ProductListRow } from "@/data/mockProducts"

import { useProductCatalogFilters } from "@/hooks/products/useProductCatalogFilters"
import type { ProductSortColumnPayload } from "@/hooks/products/useProductsCatalogList"
import { useProductsCatalogList } from "@/hooks/products/useProductsCatalogList"
import { useListRowSelection } from "@/hooks/useListRowSelection"

import { cn } from "@/lib/cn"
import { transitionShadowEnter } from "@/lib/motionClasses"

const LIST_PAGE_SIZE = 20

export function ProductListPage(): JSX.Element {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const resetPage = useCallback((): void => {
    setPage(1)
  }, [])

  const filters = useProductCatalogFilters({ onPageReset: resetPage })

  const [sortState, setSortState] = useState<ListSortState<ProductColumnId>>({
    column: "updatedAt",
    direction: "desc",
  })

  const filteredSortColumn: keyof ProductSortColumnPayload | null =
    sortState.direction === "none" || sortState.column === null
      ? null
      : SORTABLE_PRODUCT_COLUMNS.has(sortState.column)
        ? (sortState.column as keyof ProductSortColumnPayload)
        : null

  const listQuery = useProductsCatalogList({
    debouncedSearch: filters.debouncedSearch,
    statuses: filters.statuses,
    page,
    pageSize: LIST_PAGE_SIZE,
    sortColumn: filteredSortColumn,
    sortDirection: sortState.direction,
  })

  const rows = listQuery.data?.rows ?? []
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows])
  const isBusy = listQuery.isLoading || listQuery.isFetching

  const { selectedCount, selection, clearSelection } = useListRowSelection(rowIds, [
    page,
    filters.debouncedSearch,
    filters.statuses,
    sortState,
  ])

  const onRequestSort = useCallback((columnId: ProductColumnId): void => {
    if (!SORTABLE_PRODUCT_COLUMNS.has(columnId)) return
    setSortState((prev) => {
      if (prev.column !== columnId) {
        return { column: columnId, direction: columnId === "updatedAt" ? "desc" : "asc" }
      }
      if (prev.direction === "asc") return { column: columnId, direction: "desc" }
      if (prev.direction === "desc") return { column: null, direction: "none" }
      return { column: columnId, direction: columnId === "updatedAt" ? "desc" : "asc" }
    })
    resetPage()
  }, [resetPage])

  const onSortControlChange = useCallback(
    (column: keyof ProductSortColumnPayload, direction: SortDirection): void => {
      setSortState({ column, direction })
      resetPage()
    },
    [resetPage],
  )

  const getRowActions = useCallback(
    (row: ProductListRow): RowActionItem[] => [
      {
        id: "view",
        label: "View detail",
        onSelect: () => {
          void navigate(`/products/${encodeURIComponent(row.id)}`)
        },
      },
      {
        id: "edit-placeholder",
        label: "Manage inventory",
        onSelect: () => {
          toast({
            title: "Inventory editing ships in Sprint 3",
            description: "Use Medusa Dashboard until then.",
          })
        },
      },
    ],
    [navigate, toast],
  )

  const goToDetail = useCallback(
    (row: ProductListRow): void => {
      void navigate(`/products/${encodeURIComponent(row.id)}`)
    },
    [navigate],
  )

  const totalCount = listQuery.data?.totalCount ?? 0

  const emptyBanner = (): JSX.Element => {
    if (listQuery.error instanceof Error) {
      return (
        <ListEmptyState title="Could not load catalogue" description={listQuery.error.message} />
      )
    }
    if (
      rows.length === 0 &&
      filters.debouncedSearch.trim().length === 0 &&
      !filters.hasActiveFilters
    ) {
      return (
        <ListEmptyState
          bare
          title="No catalogue entries yet"
          description="Publish items in Medusa Admin to hydrate this read-only view automatically."
        />
      )
    }
    return (
      <ListEmptyState
        bare
        title="No matches"
        description="Try another keyword or adjust the active filters."
      />
    )
  }

  const sortControlColumn: keyof ProductSortColumnPayload = filteredSortColumn ?? "updatedAt"
  const sortControlDirection: SortDirection =
    sortState.direction === "asc" ? "asc" : "desc"

  const listControls = useMemo(
    () => (
      <>
        <AddFilterMenu
          categories={PRODUCT_FILTER_CATEGORIES}
          activeFilters={filters.activeFilters}
          onAdd={filters.addFilter}
          onUpdate={filters.updateFilter}
          onSearchSubmit={(value) => {
            filters.setSearchDraft(value)
            resetPage()
          }}
          filterAriaLabel="Filter products"
        />
        <ListSortControl
          options={PRODUCT_CATALOG_SORT_OPTIONS}
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
    [
      filters.activeFilters,
      filters.addFilter,
      filters.updateFilter,
      filters.setSearchDraft,
      filters.isSearching,
      sortControlColumn,
      sortControlDirection,
      onSortControlChange,
      resetPage,
    ],
  )

  const pageChrome = useMemo(
    () => ({
      titleBadge: (
        <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-xs font-semibold tabular-nums text-content-secondary">
          {listQuery.isFetched ? totalCount : "…"}
        </span>
      ),
      toolbar: listControls,
      actions: (
        <>
          <IconButton
            variant="ghost"
            label="Categories"
            onClick={() => {
              navigate("/product-categories")
            }}
          >
            <IconCategories size={18} />
          </IconButton>
          <IconButton
            variant="primary"
            label="Create product"
            onClick={() => {
              navigate("/products/new")
            }}
          >
            <IconPlus size={18} strokeWidth={2.25} />
          </IconButton>
        </>
      ),
    }),
    [listControls, listQuery.isFetched, totalCount, navigate],
  )

  usePageChrome(pageChrome)

  return (
    <ListPageShell
      listControls={listControls}
      filterBar={
        <ListFilterBar
          filterCategories={PRODUCT_FILTER_CATEGORIES}
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
      footerScrollKey={`${rows.length}:${isBusy}`}
      pagination={(footerFloating) => (
        <ListPagination
          aria-label="MercFlow product pagination"
          className={cn(
            "border-t border-border-subtle",
            transitionShadowEnter,
            footerFloating ? "shadow-md" : "shadow-none",
          )}
          currentPage={page}
          totalItems={totalCount}
          pageSize={LIST_PAGE_SIZE}
          onPageChange={setPage}
          onPageSizeChange={() => {}}
          pageSizeOptions={[LIST_PAGE_SIZE]}
        />
      )}
      bulkActions={
        <ProductCatalogBulkActions
          selectedCount={selectedCount}
          onClearSelection={clearSelection}
        />
      }
    >
      <div className="flex flex-1 flex-col">
        <div className="hidden min-h-0 flex-1 md:flex md:flex-col">
          <DataTable<ProductListRow, ProductColumnId>
            aria-label="MercFlow product catalogue results"
            columns={PRODUCT_CATALOG_COLUMNS}
            data={rows}
            getRowId={(row) => row.id}
            sortState={sortState}
            onRequestSort={onRequestSort}
            selection={selection}
            getRowActions={getRowActions}
            onRowClick={goToDetail}
            hasRowActions
            isLoading={isBusy}
            emptyState={emptyBanner()}
            fillHeight
          />
        </div>

        <div className="md:hidden">
          {isBusy ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-content-tertiary">
              <Spinner size="sm" /> Loading catalogue…
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-10">{emptyBanner()}</div>
          ) : (
            <ProductCardGrid rows={rows} selection={selection} />
          )}
        </div>
      </div>
    </ListPageShell>
  )
}
