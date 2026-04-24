import { useCallback, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import { ListToolbar } from "@/components/ui/list/ListToolbar"
import { type RowActionItem } from "@/components/ui/list/RowActionsMenu"
import { type ListColumnDef } from "@/components/ui/list/types"
import {
  MOCK_PRODUCT_CATEGORIES,
  type ProductCategoryListRow,
} from "@/data/mockProductCategories"
import { useMockEntityListState } from "@/hooks/useMockEntityListState"

type CategoryCol = "name" | "handle" | "productCount" | "updatedAt"

const CATEGORY_COLUMNS: ListColumnDef<ProductCategoryListRow, CategoryCol>[] =
  [
    {
      id: "name",
      header: "Name",
      sortable: true,
      getSortValue: (r) => r.name,
      cellClassName: "font-medium",
      renderCell: (r) => (
        <Link
          to={`/product-categories/${encodeURIComponent(r.id)}`}
          className="text-interactive-primary hover:text-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          {r.name}
        </Link>
      ),
    },
    {
      id: "handle",
      header: "Handle",
      sortable: true,
      getSortValue: (r) => r.handle,
      renderCell: (r) => (
        <code className="text-xs text-content-tertiary">{r.handle}</code>
      ),
    },
    {
      id: "productCount",
      header: "Products",
      sortable: true,
      getSortValue: (r) => r.productCount,
      cellClassName: "text-content-secondary",
      renderCell: (r) => String(r.productCount),
    },
    {
      id: "updatedAt",
      header: "Last updated",
      sortable: true,
      getSortValue: (r) => new Date(r.updatedAt).getTime(),
      renderCell: (r) => (
        <time dateTime={r.updatedAt} className="text-content-secondary">
          {new Date(r.updatedAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </time>
      ),
    },
  ]

/**
 * Product category list (mock). Route `/product-categories` mirrors a common
 * Medusa admin path; replace `MOCK_PRODUCT_CATEGORIES` with API data later.
 */
export function ProductCategoryListPage(): JSX.Element {
  const [useEmpty, setUseEmpty] = useState(false)
  const allRows = useMemo(
    () => (useEmpty ? [] : MOCK_PRODUCT_CATEGORIES),
    [useEmpty]
  )

  const filterRow = useCallback((r: ProductCategoryListRow, query: string) => {
    const t = query.trim().toLowerCase()
    return (
      r.name.toLowerCase().includes(t) ||
      r.handle.toLowerCase().includes(t) ||
      String(r.productCount).includes(t)
    )
  }, [])

  const {
    search,
    setSearch,
    pageSize,
    setPageSize,
    isLoading,
    setIsLoading,
    sort,
    onRequestSort,
    paged,
    sorted,
    currentPage,
    selectedIds,
    onSelectAll,
    onSelectRow,
    setPage,
  } = useMockEntityListState({
    allRows,
    columns: CATEGORY_COLUMNS,
    getRowId: (r) => r.id,
    initialSort: { column: "name", direction: "asc" },
    filterRow,
  })

  const getRowActions = (row: ProductCategoryListRow): RowActionItem[] => [
    { id: "view", label: "View (mock)", onSelect: () => { window.alert(`View ${row.name}`) } },
    { id: "edit", label: "Edit (mock)", onSelect: () => { window.alert(`Edit ${row.name}`) } },
    { id: "reorder", label: "Move (mock)", onSelect: () => { window.alert(`Move ${row.name}`) } },
    { id: "delete", label: "Delete (mock)", destructive: true, onSelect: () => { window.alert(`Delete ${row.name}`) } },
  ]

  return (
    <div className="p-6">
        <div className="overflow-hidden rounded-lg border border-border-default bg-surface-default shadow-sm">
          <ListToolbar
            title="Product categories"
            description="Group products for the storefront (static mock). Wire Medusa `product categories` when the Admin client is available."
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
                  className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                  onClick={() => {
                    setIsLoading((v) => !v)
                  }}
                >
                  Toggle loading
                </button>
                <button
                  type="button"
                  className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                  onClick={() => {
                    setUseEmpty((v) => !v)
                  }}
                >
                  {useEmpty ? "Show mock rows" : "Empty state (test)"}
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
                  setSearch(e.target.value)
                }}
                placeholder="Name, handle, or count"
                className="min-w-0 flex-1 rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus"
                aria-label="Filter categories by name, handle, or product count"
                disabled={useEmpty}
              />
            </label>
          </ListToolbar>
          <DataTable<ProductCategoryListRow, CategoryCol>
            aria-label="Product category list"
            caption="Product categories (mock data)"
            columns={CATEGORY_COLUMNS}
            data={paged}
            getRowId={(r) => r.id}
            sortState={sort}
            onRequestSort={onRequestSort}
            selection={{ selectedIds, onSelectAll, onSelectRow }}
            getRowActions={getRowActions}
            isLoading={isLoading}
            emptyState={
              <ListEmptyState
                title="No categories match"
                description={useEmpty ? "Mock list is empty for testing, or your search has no results." : "Try a different search or clear the filter."}
                action={useEmpty ? undefined : (
                  <button
                    type="button"
                    className="rounded-md border border-border-default bg-surface-raised px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm"
                    onClick={() => { setSearch("") }}
                  >
                    Clear search
                  </button>
                )}
              />
            }
          />
          <ListPagination
            aria-label="Product category list pagination"
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={sorted.length}
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
