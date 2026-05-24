import type { JSX } from "react"
import { useCallback, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { ProductCategoryHierarchyTable } from "@/components/product-categories/ProductCategoryHierarchyTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import { ListToolbar } from "@/components/ui/list/ListToolbar"
import { type RowActionItem } from "@/components/ui/list/RowActionsMenu"
import { useAdminProductCategories } from "@/features/product-categories"
import type { AdminProductCategoryHierarchyRow } from "@/features/product-categories/types"

/**
 * Categories list backed by GET /admin/product-categories. Rows are rendered in
 * depth-first hierarchical order so child categories render indented under parents.
 */
export function ProductCategoryListPage(): JSX.Element {
  const navigate = useNavigate()
  const { state, reload, filteredRows, totalRowCount, search, setSearch } =
    useAdminProductCategories()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const onSearchChange = useCallback(
    (v: string): void => {
      setSearch(v)
      setPage(1)
    },
    [setSearch]
  )

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
    [navigate]
  )

  const blockingNotice =
    state.status === "config_error" || state.status === "error"


  const disableSearchInputs =
    state.status === "idle" ||
    state.status === "loading" ||
    state.status === "config_error" ||
    state.status === "error" ||
    (state.status === "success" && totalRowCount === 0)

  const showTableBodyLoading = state.status === "loading"

  let notice: JSX.Element | null = null

  if (blockingNotice) {
    notice = (
      <div
        role="alert"
        className="mb-4 rounded-md border border-border-default bg-surface-raised p-4 text-sm text-content-secondary"
      >
        <p className="font-medium text-content-primary">
          {state.status === "config_error"
            ? "Admin backend not configured"
            : "Unable to load categories"}
        </p>
        <p className="mt-2">{state.message}</p>
        <button
          type="button"
          className="mt-3 rounded-md bg-interactive-primary px-3 py-1.5 text-sm font-medium text-content-inverse transition hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          onClick={() => {
            void reload()
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  let emptyOverlay: JSX.Element | null = null

  const showSkeleton =
    !blockingNotice && (state.status === "idle" || state.status === "loading")

  const showCatalogEmptyNotice =
    !blockingNotice &&
    state.status === "success" &&
    totalRowCount === 0 &&
    !showSkeleton

  if (showCatalogEmptyNotice) {
    emptyOverlay = (
      <div className="p-10">
        <ListEmptyState
          title="No product categories yet"
          description="Create categories in Medusa Admin, then refresh this page to see them grouped as a hierarchy."
          action={
            <button
              type="button"
              className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              onClick={() => {
                void reload()
              }}
            >
              Refresh list
            </button>
          }
        />
      </div>
    )
  }

  let filterEmptyOverlay: JSX.Element | null = null

  if (
    !blockingNotice &&
    state.status === "success" &&
    totalRowCount > 0 &&
    filteredRows.length === 0
  ) {
    filterEmptyOverlay = (
      <div className="p-10">
        <ListEmptyState
          title="No categories match your search"
          description="Try a different name, handle, or product count."
          action={
            <button
              type="button"
              className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              onClick={() => {
                onSearchChange("")
              }}
            >
              Clear search
            </button>
          }
        />
      </div>
    )
  }

  const refreshDisabled =
    state.status === "config_error" || state.status === "idle" || state.status === "loading"

  return (
    <div className="p-6">
      {notice}
      <div className="overflow-hidden rounded-lg border border-border-default bg-surface-default shadow-sm">
        <ListToolbar
          title="Product categories"
          description="Nested list from Medusa (parents with indented children)."
          end={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/product-categories/new"
                className="rounded-md bg-interactive-primary px-3 py-1.5 text-sm font-medium text-content-inverse transition hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              >
                New category
              </Link>
              <Link
                to="/products"
                className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
              >
                Products
              </Link>
              <button
                type="button"
                className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
                onClick={() => {
                  void reload()
                }}
                disabled={refreshDisabled}
              >
                Refresh
              </button>
            </div>
          }
        >
          <label className="flex min-w-0 max-w-sm flex-1 items-center gap-2">
            <span className="shrink-0 text-sm text-content-secondary">Search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                onSearchChange(e.target.value)
              }}
              placeholder="Name, handle, or count"
              disabled={disableSearchInputs}
              className="min-w-0 flex-1 rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus"
              aria-label="Filter categories by name, handle, or product count"
            />
          </label>
        </ListToolbar>
        {emptyOverlay}
        {!blockingNotice && !emptyOverlay && (state.status === "success" || showSkeleton) ? (
          <>
            <ProductCategoryHierarchyTable
              rows={showTableBodyLoading ? [] : pagedRows}
              isLoading={showSkeleton}
              emptyState={filterEmptyOverlay}
              getRowActions={getRowActions}
            />
            {state.status === "success" && filteredRows.length > 0 ? (
              <ListPagination
                aria-label="Product category list pagination"
                currentPage={page}
                pageSize={pageSize}
                totalItems={filteredRows.length}
                onPageChange={setPage}
                onPageSizeChange={(n) => {
                  setPageSize(n)
                  setPage(1)
                }}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
