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
  FilterResultsSummary,
  ProductListFilterBar,
  type ActiveFilter,
  type FilterCategory,
} from "@/components/product-list/filter"
import { ProductStatusBadge } from "@/components/product-list/ProductStatusBadge"
import { ProductThumbnail } from "@/components/product-list/ProductThumbnail"
import { rowMatchesProductFilter } from "@/components/product-list/productListFilterLogic"
import { MOCK_PRODUCTS, type ProductListRow } from "@/data/mockProducts"
import { useMockEntityListState } from "@/hooks/useMockEntityListState"
import { cn } from "@/lib/cn"

// ── Types ─────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "published" | "draft" | "proposed"
type ProductCol = "thumbnail" | "title" | "status" | "collection" | "updatedAt"

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all",       label: "All"       },
  { id: "published", label: "Published" },
  { id: "draft",     label: "Draft"     },
  { id: "proposed",  label: "Proposed"  },
]

const ROW_ACTIONS: RowActionItem[] = [
  { id: "view",      label: "View",      onSelect: () => {} },
  { id: "edit",      label: "Edit",      onSelect: () => {} },
  { id: "duplicate", label: "Duplicate", onSelect: () => {} },
  { id: "delete",    label: "Delete",    destructive: true,  onSelect: () => {} },
]

const PRODUCT_COLUMNS: ListColumnDef<ProductListRow, ProductCol>[] = [
  {
    id: "thumbnail",
    header: "",
    sortable: false,
    headerClassName: "w-10",
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
          className="text-sm font-medium text-content-primary hover:text-accent focus-visible:outline-none focus-visible:text-accent"
        >
          {r.title}
        </Link>
        <p className="mt-0.5 font-mono text-2xs text-content-tertiary">{r.sku}</p>
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
      <span className="text-sm text-content-secondary">{r.collection}</span>
    ),
  },
  {
    id: "updatedAt",
    header: "Updated",
    sortable: true,
    getSortValue: (r) => new Date(r.updatedAt).getTime(),
    renderCell: (r) => (
      <time dateTime={r.updatedAt} className="text-sm text-content-tertiary">
        {new Date(r.updatedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </time>
    ),
  },
]

// ── StatusTabBar ──────────────────────────────────────────────────────────────

function StatusTabBar({
  active,
  counts,
  onChange,
}: {
  active: StatusFilter
  counts: Record<StatusFilter, number>
  onChange: (s: StatusFilter) => void
}): JSX.Element {
  return (
    <div className="flex items-center border-b border-border-subtle px-4">
      {STATUS_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
            active === tab.id
              ? "border-content-primary text-content-primary"
              : "border-transparent text-content-tertiary hover:text-content-secondary",
          )}
        >
          {tab.label}
          <span
            className={cn(
              "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-sm px-1 text-3xs font-semibold tabular-nums",
              active === tab.id
                ? "bg-surface-subtle text-content-secondary"
                : "text-content-tertiary",
            )}
          >
            {counts[tab.id]}
          </span>
        </button>
      ))}
    </div>
  )
}

// ── Filter categories ─────────────────────────────────────────────────────────

const ALL_COLLECTIONS = Array.from(
  new Set(MOCK_PRODUCTS.map((r) => r.collection)),
).sort()

const FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: "status",
    label: "Status",
    type: "enum",
    operators: ["is", "is not"],
    values: [
      { id: "published", label: "Published" },
      { id: "draft",     label: "Draft"     },
      { id: "proposed",  label: "Proposed"  },
    ],
  },
  {
    id: "collection",
    label: "Collection",
    type: "enum",
    operators: ["is", "is not"],
    values: ALL_COLLECTIONS.map((c) => ({ id: c, label: c })),
  },
  {
    id: "updated",
    label: "Updated",
    type: "date",
    operators: ["after", "before"],
    values: [
      { id: "today", label: "Today"      },
      { id: "week",  label: "This week"  },
      { id: "month", label: "This month" },
    ],
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export function ProductListPage(): JSX.Element {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])

  const filterRow = useCallback(
    (r: ProductListRow, query: string): boolean => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      if (!activeFilters.every((f) => rowMatchesProductFilter(r, f))) return false
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

  const statusCounts = useMemo(
    () => ({
      all:       MOCK_PRODUCTS.length,
      published: MOCK_PRODUCTS.filter((r) => r.status === "published").length,
      draft:     MOCK_PRODUCTS.filter((r) => r.status === "draft").length,
      proposed:  MOCK_PRODUCTS.filter((r) => r.status === "proposed").length,
    }),
    [],
  )

  const isFiltered =
    activeFilters.length > 0 || search.trim().length > 0 || statusFilter !== "all"

  function clearAll(): void {
    setActiveFilters([])
    setSearch("")
    setStatusFilter("all")
    setPage(1)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="overflow-hidden rounded-md border border-border-default bg-surface-default">

        {/* ── Heading ── */}
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-interface font-semibold tracking-tight text-content-primary">
              Products
            </h1>
            {/* Live count badge — updates with filter state */}
            <span className="inline-flex items-center rounded bg-surface-subtle px-1.5 py-0.5 text-2xs font-semibold tabular-nums text-content-tertiary">
              {isFiltered ? `${sorted.length} of ${MOCK_PRODUCTS.length}` : MOCK_PRODUCTS.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/product-categories"
              className="hidden text-sm font-medium text-content-tertiary transition-colors hover:text-content-secondary sm:block"
            >
              Categories
            </Link>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => { navigate("/products/new") }}
            >
              New product
            </Button>
          </div>
        </div>

        {/* ── Status tabs ── */}
        <StatusTabBar
          active={statusFilter}
          counts={statusCounts}
          onChange={(s) => { setStatusFilter(s); setPage(1) }}
        />

        {/* ── Filter bar (Linear pattern) ── */}
        <ProductListFilterBar
          categories={FILTER_CATEGORIES}
          activeFilters={activeFilters}
          onFiltersChange={(f) => {
            setActiveFilters(f)
            setPage(1)
          }}
          search={search}
          onSearchChange={setSearch}
          onSearchClear={() => setSearch("")}
        />

        {/* ── Results summary (Linear "X hidden by filters") ── */}
        <FilterResultsSummary
          totalItems={MOCK_PRODUCTS.length}
          filteredItems={sorted.length}
          onClear={clearAll}
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
            getRowActions={() => ROW_ACTIONS}
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
