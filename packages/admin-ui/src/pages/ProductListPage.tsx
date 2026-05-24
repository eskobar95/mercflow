import { useCallback, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import { type RowActionItem } from "@/components/ui/list/RowActionsMenu"
import { type ListColumnDef } from "@/components/ui/list/types"
import { ProductCardGrid } from "@/components/product-list/ProductCardGrid"
import {
  ProductListFilterBar,
  type ActiveFilter,
  type FilterCategory,
} from "@/components/product-list/ProductListFilterBar"
import { ProductStatusBadge } from "@/components/product-list/ProductStatusBadge"
import { ProductThumbnail } from "@/components/product-list/ProductThumbnail"
import { MOCK_PRODUCTS, type ProductListRow } from "@/data/mockProducts"
import { useMockEntityListState } from "@/hooks/useMockEntityListState"
import { cn } from "@/lib/cn"

// ── Column definitions ────────────────────────────────────────────────────────

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
    headerClassName: "w-10 px-4",
    cellClassName: "py-2 w-10",
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

// ── Filter categories ─────────────────────────────────────────────────────────

const ALL_COLLECTIONS = Array.from(
  new Set(MOCK_PRODUCTS.map((r) => r.collection))
).sort()

const FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: "status",
    label: "Status",
    values: [
      { id: "published", label: "Published" },
      { id: "draft",     label: "Draft"     },
      { id: "proposed",  label: "Proposed"  },
    ],
  },
  {
    id: "collection",
    label: "Collection",
    values: ALL_COLLECTIONS.map((c) => ({ id: c, label: c })),
  },
  {
    id: "updated",
    label: "Updated",
    values: [
      { id: "today", label: "Today"      },
      { id: "week",  label: "This week"  },
      { id: "month", label: "This month" },
    ],
  },
]

// ── Date helpers ──────────────────────────────────────────────────────────────

function startOfPeriod(period: "today" | "week" | "month"): number {
  const d = new Date()
  if (period === "today") {
    d.setHours(0, 0, 0, 0)
  } else if (period === "week") {
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
  } else {
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
  }
  return d.getTime()
}

/**
 * Test whether a row matches a single ActiveFilter.
 * "is" → row field must match any selected value.
 * "is not" → row field must NOT match any selected value.
 */
function rowMatchesFilter(row: ProductListRow, filter: ActiveFilter): boolean {
  if (filter.valueIds.length === 0) return true

  let positiveMatch: boolean

  switch (filter.categoryId) {
    case "status":
      positiveMatch = filter.valueIds.includes(row.status)
      break
    case "collection":
      positiveMatch = filter.valueIds.includes(row.collection)
      break
    case "updated":
      positiveMatch = filter.valueIds.some((v) => {
        const threshold = startOfPeriod(v as "today" | "week" | "month")
        return new Date(row.updatedAt).getTime() >= threshold
      })
      break
    default:
      return true
  }

  return filter.operator === "is" ? positiveMatch : !positiveMatch
}

// ── Page ──────────────────────────────────────────────────────────────────────

/**
 * Product list page.
 *
 * Desktop: DataTable with thumbnail column, Shopify-style status tabs,
 * Linear-style filter bar — two-level popover → chips with is/is-not operator.
 *
 * Mobile: card feed, no horizontal scroll.
 */
export function ProductListPage(): JSX.Element {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])

  const filterRow = useCallback(
    (r: ProductListRow, query: string): boolean => {
      // Status tab
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      // Active filter chips (AND logic — all must match)
      if (!activeFilters.every((f) => rowMatchesFilter(r, f))) return false
      // Text search
      if (!query.trim()) return true
      const t = query.toLowerCase()
      return (
        r.title.toLowerCase().includes(t) ||
        r.collection.toLowerCase().includes(t) ||
        r.sku.toLowerCase().includes(t)
      )
    },
    [statusFilter, activeFilters],
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

  const statusCounts = useMemo(
    () => ({
      all:       MOCK_PRODUCTS.length,
      published: MOCK_PRODUCTS.filter((r) => r.status === "published").length,
      draft:     MOCK_PRODUCTS.filter((r) => r.status === "draft").length,
      proposed:  MOCK_PRODUCTS.filter((r) => r.status === "proposed").length,
    }),
    [],
  )

  function handleFiltersChange(f: ActiveFilter[]): void {
    setActiveFilters(f)
    setPage(1)
  }

  function clearAll(): void {
    setActiveFilters([])
    setSearch("")
    setStatusFilter("all")
    setPage(1)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="overflow-hidden rounded-md border border-border-default bg-surface-default">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle px-4 py-4">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-content-primary">
              Products
            </h1>
            <p className="mt-0.5 hidden text-[13px] text-content-tertiary md:block">
              Everything you sell — variants, SKUs, status, and collections.
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

        {/* ── Status tabs (Shopify) ── */}
        <div className="flex items-center border-b border-border-subtle px-4">
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
                    : "text-content-tertiary",
                )}
              >
                {statusCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Linear-style filter bar ── */}
        <ProductListFilterBar
          categories={FILTER_CATEGORIES}
          activeFilters={activeFilters}
          onFiltersChange={handleFiltersChange}
          search={search}
          onSearchChange={setSearch}
          onSearchClear={() => setSearch("")}
        />

        {/* ── Desktop: DataTable ── */}
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
                description="Try different filters or clear the search."
                action={
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={clearAll}
                  >
                    Clear filters
                  </Button>
                }
              />
            }
          />
        </div>

        {/* ── Mobile: card feed ── */}
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
