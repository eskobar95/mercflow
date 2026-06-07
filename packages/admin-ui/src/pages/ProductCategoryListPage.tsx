import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { AddFilterMenu } from "@/components/list-filter/AddFilterMenu"
import { ListFilterBar } from "@/components/list-filter/ListFilterBar"
import { ListPageShell } from "@/components/list-page/ListPageShell"
import { ProductCategoryHierarchyTable } from "@/components/product-categories/ProductCategoryHierarchyTable"
import { usePageChrome } from "@/components/layout/pageChrome"
import { IconButton } from "@/components/ui/IconButton"
import { IconPlus } from "@/components/ui/icons"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
import { Spinner } from "@/components/ui/Spinner"

import { useAdminProductCategories } from "@/features/product-categories"
import type { AdminProductCategoryHierarchyRow } from "@/features/product-categories/types"
import { useListFilters } from "@/hooks/useListFilters"

import { cn } from "@/lib/cn"
import { transitionShadowEnter } from "@/lib/motionClasses"

const EMPTY_FILTER_CATEGORIES: never[] = []

type ProductCategoriesHook = ReturnType<typeof useAdminProductCategories>
type ProductCategoryBlockingState = Extract<
  ProductCategoriesHook["state"],
  { status: "config_error" } | { status: "error" }
>

function ProductCategoryBlockingNotice({
  state,
  reload,
}: {
  state: ProductCategoryBlockingState
  reload: ProductCategoriesHook["reload"]
}): ReactNode {
  return (
    <div className="p-6">
      <div
        role="alert"
        className="rounded-md border border-border-default bg-surface-raised p-4 text-sm text-content-secondary"
      >
        <p className="font-medium text-content-primary">
          {state.status === "config_error"
            ? "Admin backend not configured"
            : "Unable to load categories"}
        </p>
        <p className="mt-2">{state.message}</p>
        <button
          type="button"
          className="mt-3 rounded-md bg-interactive-primary px-3 py-1.5 text-sm font-medium text-content-inverse transition hover:bg-interactive-primary-hover"
          onClick={() => {
            void reload()
          }}
        >
          Retry
        </button>
      </div>
    </div>
  )
}

function ProductCategoryListPageContent({
  categories,
}: {
  categories: ProductCategoriesHook
}): ReactNode {
  const navigate = useNavigate()
  const { state, reload, filteredRows, totalRowCount, setSearch } = categories

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const resetPage = useCallback((): void => {
    setPage(1)
  }, [])

  const filters = useListFilters({ onPageReset: resetPage })

  useEffect(() => {
    setSearch(filters.debouncedSearch)
  }, [filters.debouncedSearch, setSearch])

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  const getRowActions = useCallback(
    (row: AdminProductCategoryHierarchyRow): RowActionItem[] => [
      {
        id: "open",
        label: "Open detail",
        onSelect: (): void => {
          navigate(`/product-categories/${encodeURIComponent(row.id)}`)
        },
      },
    ],
    [navigate],
  )

  const showSkeleton = state.status === "idle" || state.status === "loading"
  const showCatalogEmptyNotice =
    state.status === "success" && totalRowCount === 0 && !showSkeleton

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
          filterAriaLabel="Search categories"
        />
        {filters.isSearching ? (
          <span className="ml-0.5 inline-flex items-center" aria-hidden>
            <Spinner size="sm" label="Searching" />
          </span>
        ) : null}
      </>
    ),
    [filters, resetPage],
  )

  const pageChrome = useMemo(
    () => ({
      titleBadge: (
        <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-xs font-semibold tabular-nums text-content-secondary">
          {state.status === "loading" || state.status === "idle" ? "…" : filteredRows.length}
        </span>
      ),
      toolbar: listControls,
      actions: (
        <>
          <Link
            to="/products"
            className="hidden h-8 items-center rounded-md px-2 text-xs font-medium text-content-secondary transition-colors hover:text-content-primary sm:inline-flex"
          >
            Products
          </Link>
          <IconButton
            variant="primary"
            label="Create category"
            onClick={() => {
              navigate("/product-categories/new")
            }}
          >
            <IconPlus size={18} strokeWidth={2.25} />
          </IconButton>
        </>
      ),
    }),
    [filteredRows.length, listControls, navigate, state.status],
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

  const filterEmptyOverlay =
    state.status === "success" && totalRowCount > 0 && filteredRows.length === 0 ? (
      <div className="p-10">
        <ListEmptyState
          title="No categories match your search"
          description="Try a different name, handle, or product count."
          action={
            <button
              type="button"
              className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm"
              onClick={() => filters.clearAllFilters()}
            >
              Clear search
            </button>
          }
        />
      </div>
    ) : null

  const catalogEmpty = showCatalogEmptyNotice ? (
    <div className="p-10">
      <ListEmptyState
        title="No product categories yet"
        description="Use New category to create one here, or refresh after changes elsewhere."
        action={
          <button
            type="button"
            className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm"
            onClick={() => {
              void reload()
            }}
          >
            Refresh list
          </button>
        }
      />
    </div>
  ) : null

  return (
    <ListPageShell
      listControls={listControls}
      filterBar={filterBar}
      footerScrollKey={`${pagedRows.length}:${state.status}`}
      pagination={(footerFloating) =>
        state.status === "success" && filteredRows.length > 0 ? (
          <ListPagination
            aria-label="Product category list pagination"
            className={cn(
              "border-t border-border-subtle",
              transitionShadowEnter,
              footerFloating ? "shadow-md" : "shadow-none",
            )}
            currentPage={page}
            pageSize={pageSize}
            totalItems={filteredRows.length}
            onPageChange={setPage}
            onPageSizeChange={(next) => {
              setPageSize(next)
              setPage(1)
            }}
          />
        ) : (
          <div className="border-t border-border-subtle" />
        )
      }
    >
      {catalogEmpty}
      {!catalogEmpty ? (
        <ProductCategoryHierarchyTable
          rows={showSkeleton ? [] : pagedRows}
          isLoading={showSkeleton}
          emptyState={filterEmptyOverlay}
          getRowActions={getRowActions}
        />
      ) : null}
    </ListPageShell>
  )
}

export function ProductCategoryListPage(): ReactNode {
  const categories = useAdminProductCategories()

  if (categories.state.status === "config_error" || categories.state.status === "error") {
    return <ProductCategoryBlockingNotice state={categories.state} reload={categories.reload} />
  }

  return <ProductCategoryListPageContent categories={categories} />
}
