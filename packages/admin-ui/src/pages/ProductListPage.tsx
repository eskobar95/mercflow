import { useCallback, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { SearchInput } from "@/components/ui/SearchInput"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import { type RowActionItem } from "@/components/ui/list/RowActionsMenu"
import { type ListColumnDef } from "@/components/ui/list/types"
import { ProductCardGrid } from "@/components/product-list/ProductCardGrid"
import { ProductStatusBadge } from "@/components/product-list/ProductStatusBadge"
import { ProductThumbnail } from "@/components/product-list/ProductThumbnail"
import { MOCK_PRODUCTS, type ProductListRow } from "@/data/mockProducts"
import { useMockEntityListState } from "@/hooks/useMockEntityListState"
import { cn } from "@/lib/cn"

// SKU is shown inline under the product title — removed from standalone column

type StatusFilter = "all" | "published" | "draft" | "proposed"
type ProductCol = "thumbnail" | "title" | "status" | "collection" | "updatedAt"

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all",       label: "All"       },
  { id: "published", label: "Published" },
  { id: "draft",     label: "Draft"     },
  { id: "proposed",  label: "Proposed"  },
]

const PRODUCT_COLUMNS: ListColumnDef<ProductListRow, ProductCol>[] = [
  {
    id: "thumbnail",
    header: "",
    sortable: false,
    headerClassName: "w-0",
    cellClassName: "py-2",
    renderCell: (r) => (
      <ProductThumbnail title={r.title} hue={r.thumbnailHue} size={36} />
    ),
  },
  {
    id: "title",
    header: "Product",
    sortable: true,
    getSortValue: (r) => r.title,
    renderCell: (r) => (
      <div>
        <Link
          to={`/products/${encodeURIComponent(r.id)}`}
          className="text-[13px] font-medium text-content-primary hover:text-accent focus-visible:outline-none focus-visible:text-accent"
        >
          {r.title}
        </Link>
        <p className="mt-0.5 font-mono text-[11px] text-content-tertiary">{r.sku}</p>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    getSortValue: (r) => r.status,
    renderCell: (r) => <ProductStatusBadge status={r.status} />,
  },
  {
    id: "collection",
    header: "Collection",
    sortable: true,
    getSortValue: (r) => r.collection,
    renderCell: (r) => (
      <span className="text-[13px] text-content-secondary">{r.collection}</span>
    ),
  },
  {
    id: "updatedAt",
    header: "Updated",
    sortable: true,
    getSortValue: (r) => new Date(r.updatedAt).getTime(),
    renderCell: (r) => (
      <time dateTime={r.updatedAt} className="text-[13px] text-content-tertiary">
        {new Date(r.updatedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </time>
    ),
  },
]

/**
 * Product list page.
 *
 * Desktop: DataTable with thumbnail column, Shopify-style status tabs,
 * Linear-style compact filter/sort bar.
 *
 * Mobile (<md): card list — thumbnail + key fields, no horizontal scroll.
 */
export function ProductListPage(): JSX.Element {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const filterRow = useCallback(
    (r: ProductListRow, query: string): boolean => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      if (!query.trim()) return true
      const t = query.toLowerCase()
      return (
        r.title.toLowerCase().includes(t) ||
        r.collection.toLowerCase().includes(t) ||
        r.sku.toLowerCase().includes(t)
      )
    },
    [statusFilter],
  )

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
    allRows: MOCK_PRODUCTS,
    columns: PRODUCT_COLUMNS,
    getRowId: (r) => r.id,
    initialSort: { column: "updatedAt", direction: "desc" },
    filterRow,
  })

  const getRowActions = (_row: ProductListRow): RowActionItem[] => [
    { id: "view",      label: "View",      onSelect: () => {} },
    { id: "edit",      label: "Edit",      onSelect: () => {} },
    { id: "duplicate", label: "Duplicate", onSelect: () => {} },
    { id: "delete",    label: "Delete",    destructive: true, onSelect: () => {} },
  ]

  const statusCounts = {
    all:       MOCK_PRODUCTS.length,
    published: MOCK_PRODUCTS.filter((r) => r.status === "published").length,
    draft:     MOCK_PRODUCTS.filter((r) => r.status === "draft").length,
    proposed:  MOCK_PRODUCTS.filter((r) => r.status === "proposed").length,
  }

  const activeSort = sort.column !== "updatedAt" || sort.direction !== "desc"
    ? `${sort.column === "updatedAt" ? "Updated" : sort.column === "title" ? "Product" : sort.column === "status" ? "Status" : sort.column === "collection" ? "Collection" : sort.column} ${sort.direction === "asc" ? "↑" : "↓"}`
    : null

  return (
    <div className="p-4 md:p-6">
      <div className="overflow-hidden rounded-md border border-border-default bg-surface-default">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle px-4 py-4">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-content-primary">Products</h1>
            <p className="mt-0.5 hidden text-[13px] text-content-tertiary md:block">
              Everything you sell — variants, SKUs, status, and the collection each one belongs to.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => { navigate("/products/new") }}
            >
              New product
            </Button>
            <Link
              to="/product-categories"
              className="text-[13px] font-medium text-accent hover:text-accent-strong"
            >
              Categories
            </Link>
          </div>
        </div>

        {/* ── Status tabs (Shopify pattern) ── */}
        <div className="flex items-center gap-0 border-b border-border-subtle px-4">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id)
                setPage(1)
              }}
              className={cn(
                "relative flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors",
                statusFilter === tab.id
                  ? "border-content-primary text-content-primary"
                  : "border-transparent text-content-tertiary hover:text-content-secondary",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "inline-flex h-4 min-w-4 items-center justify-center rounded-sm px-1 text-[10px] font-semibold tabular-nums",
                  statusFilter === tab.id
                    ? "bg-surface-subtle text-content-secondary"
                    : "bg-transparent text-content-tertiary",
                )}
              >
                {statusCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Filter / sort toolbar (Linear pattern) ── */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-4 py-2">
          <SearchInput
            value={search}
            onChange={(e) => { setSearch(e.target.value) }}
            onClear={() => { setSearch("") }}
            placeholder="Search products…"
            aria-label="Filter products"
            className="max-w-xs flex-1"
          />
          {/* Active sort chip (Linear-style) */}
          {activeSort ? (
            <span className="inline-flex items-center gap-1 rounded border border-border-default bg-accent-subtle px-2 py-1 text-[11px] font-medium text-accent-text">
              Sort: {activeSort}
              <button
                type="button"
                aria-label="Clear sort"
                className="ml-0.5 text-accent-text/60 hover:text-accent-text"
                onClick={() => { onRequestSort("updatedAt" as ProductCol) }}
              >
                ×
              </button>
            </span>
          ) : null}
        </div>

        {/* ── Desktop: DataTable — hidden on mobile ── */}
        <div className="hidden md:block">
          <DataTable<ProductListRow, ProductCol>
            aria-label="Product list"
            caption="Product catalog"
            columns={PRODUCT_COLUMNS}
            data={paged}
            getRowId={(r) => r.id}
            sortState={sort}
            onRequestSort={onRequestSort}
            selection={{ selectedIds, onSelectAll, onSelectRow }}
            getRowActions={getRowActions}
            emptyState={
              <ListEmptyState
                title="No products match"
                description="Try a different search or clear the filter."
                action={
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearch("")
                      setStatusFilter("all")
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            }
          />
        </div>

        {/* ── Mobile: card view — hidden on desktop ── */}
        <div className="block md:hidden">
          <ProductCardGrid rows={paged} />
        </div>

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
