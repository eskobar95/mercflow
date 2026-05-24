import { useCallback } from "react"
import { Link } from "react-router-dom"

import { SearchInput } from "@/components/ui/SearchInput"
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
 * Product category list. Backed by mock data today; switches to the Medusa
 * Admin `product_categories` endpoint once the client lands. Dev state
 * toggles live on `/list-demo` so this page stays focused on the catalogue.
 */
export function ProductCategoryListPage(): JSX.Element {
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
    sort,
    onRequestSort,
    paged,
    sorted,
    currentPage,
    selectedIds,
    onSelectAll,
    onSelectRow,
    setPage,
    setPageSize,
  } = useMockEntityListState({
    allRows: MOCK_PRODUCT_CATEGORIES,
    columns: CATEGORY_COLUMNS,
    getRowId: (r) => r.id,
    initialSort: { column: "name", direction: "asc" },
    filterRow,
  })

  const getRowActions = (_row: ProductCategoryListRow): RowActionItem[] => [
    { id: "view", label: "View", onSelect: () => { /* TODO: navigate to /product-categories/:id */ } },
    { id: "edit", label: "Edit", onSelect: () => { /* TODO: navigate to /product-categories/:id/edit */ } },
    { id: "reorder", label: "Move", onSelect: () => { /* TODO: PATCH sort order */ } },
    { id: "delete", label: "Delete", destructive: true, onSelect: () => { /* TODO: DELETE category */ } },
  ]

  return (
    <div className="p-6">
        <div className="overflow-hidden rounded-md border border-border-default bg-surface-default">
          <ListToolbar
            title="Product categories"
            description="How products are grouped on the storefront — name, handle, and how many products each group holds."
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
              </div>
            }
          >
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
              }}
              onClear={() => {
                setSearch("")
              }}
              placeholder="Name, handle, or count"
              aria-label="Filter categories by name, handle, or product count"
              className="min-w-0 max-w-sm flex-1"
            />
          </ListToolbar>
          <DataTable<ProductCategoryListRow, CategoryCol>
            aria-label="Product category list"
            caption="Product categories"
            columns={CATEGORY_COLUMNS}
            data={paged}
            getRowId={(r) => r.id}
            sortState={sort}
            onRequestSort={onRequestSort}
            selection={{ selectedIds, onSelectAll, onSelectRow }}
            getRowActions={getRowActions}
            emptyState={
              <ListEmptyState
                title="No categories match"
                description="Try a different search or clear the filter."
                action={
                  <button
                    type="button"
                    className="rounded-md border border-border-default bg-surface-raised px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm"
                    onClick={() => { setSearch("") }}
                  >
                    Clear search
                  </button>
                }
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
