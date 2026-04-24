import { useCallback, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import { ListToolbar } from "@/components/ui/list/ListToolbar"
import { type RowActionItem } from "@/components/ui/list/RowActionsMenu"
import { type ListColumnDef } from "@/components/ui/list/types"
import { MOCK_PRODUCTS, type ProductListRow } from "@/data/mockProducts"
import { useMockEntityListState } from "@/hooks/useMockEntityListState"

type ProductCol = "title" | "status" | "collection" | "sku" | "updatedAt"

const PRODUCT_COLUMNS: ListColumnDef<ProductListRow, ProductCol>[] = [
  {
    id: "title",
    header: "Title",
    sortable: true,
    getSortValue: (r) => r.title,
    cellClassName: "font-medium",
    renderCell: (r) => r.title,
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    getSortValue: (r) => r.status,
    renderCell: (r) => (
      <span className="inline-flex items-center rounded-md border border-border-subtle bg-surface-subtle px-2 py-0.5 text-xs font-medium capitalize text-content-secondary">
        {r.status}
      </span>
    ),
  },
  {
    id: "collection",
    header: "Collection",
    sortable: true,
    getSortValue: (r) => r.collection,
    renderCell: (r) => r.collection,
  },
  {
    id: "sku",
    header: "SKU",
    sortable: true,
    getSortValue: (r) => r.sku,
    renderCell: (r) => (
      <code className="text-xs text-content-tertiary">{r.sku}</code>
    ),
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
 * Product list (mock data). Future: connect to Medusa Admin product list API;
 * see README “Entity lists (mock data)”.
 */
export function ProductListPage(): JSX.Element {
  const [useEmpty, setUseEmpty] = useState(false)
  const allRows = useMemo(
    () => (useEmpty ? [] : MOCK_PRODUCTS),
    [useEmpty]
  )

  const filterRow = useCallback((r: ProductListRow, query: string) => {
    const t = query.trim().toLowerCase()
    return (
      r.title.toLowerCase().includes(t) ||
      r.status.toLowerCase().includes(t) ||
      r.collection.toLowerCase().includes(t) ||
      r.sku.toLowerCase().includes(t)
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
    columns: PRODUCT_COLUMNS,
    getRowId: (r) => r.id,
    initialSort: { column: "updatedAt", direction: "desc" },
    filterRow,
  })

  const getRowActions = (row: ProductListRow): RowActionItem[] => [
    { id: "view", label: "View (mock)", onSelect: () => { window.alert(`View ${row.title}`) } },
    { id: "edit", label: "Edit (mock)", onSelect: () => { window.alert(`Edit ${row.title}`) } },
    { id: "duplicate", label: "Duplicate (mock)", onSelect: () => { window.alert(`Duplicate ${row.title}`) } },
    { id: "delete", label: "Delete (mock)", destructive: true, onSelect: () => { window.alert(`Delete ${row.title}`) } },
  ]

  return (
    <div className="p-6">
        <div className="overflow-hidden rounded-lg border border-border-default bg-surface-default shadow-sm">
          <ListToolbar
            title="Products"
            description="Catalog products (static mock). Replace with Medusa list fetch when the Admin client is available."
            end={
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/product-categories"
                  className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
                >
                  Product categories
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
                placeholder="Title, status, collection, or SKU"
                className="min-w-0 flex-1 rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus"
                aria-label="Filter products by title, status, collection, or SKU"
                disabled={useEmpty}
              />
            </label>
          </ListToolbar>
          <DataTable<ProductListRow, ProductCol>
            aria-label="Product list"
            caption="Product catalog (mock data)"
            columns={PRODUCT_COLUMNS}
            data={paged}
            getRowId={(r) => r.id}
            sortState={sort}
            onRequestSort={onRequestSort}
            selection={{ selectedIds, onSelectAll, onSelectRow }}
            getRowActions={getRowActions}
            isLoading={isLoading}
            emptyState={
              <ListEmptyState
                title="No products match"
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
            aria-label="Product list pagination"
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
