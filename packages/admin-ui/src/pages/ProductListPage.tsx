import { useCallback, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { ProductCardGrid } from "@/components/product-list/ProductCardGrid"
import { ProductStatusBadge } from "@/components/product-list/ProductStatusBadge"
import { ProductThumbnail } from "@/components/product-list/ProductThumbnail"
import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/list/DataTable"
import { Input } from "@/components/ui/Input"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
import type { ListColumnDef, ListSortState } from "@/components/ui/list/types"

import { MOCK_PRODUCTS, type ProductListRow } from "@/data/mockProducts"

import type {
  ProductsStatusTabFilter,
  ProductSortColumnPayload,
} from "@/hooks/products/useProductsCatalogList"
import { useProductsCatalogList } from "@/hooks/products/useProductsCatalogList"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"

import { cn } from "@/lib/cn"

import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

const LIST_PAGE_SIZE = 20

type ProductColumnId =
  | "thumbnail"
  | "title"
  | "status"
  | "variantsCount"
  | "stockTotal"
  | "priceRange"
  | "updatedAt"

const STATUS_TAB_CONFIG: {
  id: ProductsStatusTabFilter
  label: string
  description: string
}[] = [
  { id: "all", label: "All", description: "Every product regardless of storefront status." },
  { id: "active", label: "Active", description: "Products published across sales channels." },
  { id: "draft", label: "Draft", description: "Work-in-progress catalogue entries." },
]

const SORTABLE_PRODUCT_COLUMNS = new Set<ProductColumnId>([
  "title",
  "status",
  "updatedAt",
])

function StatusTabRail({
  active,
  counts,
  onChange,
}: {
  active: ProductsStatusTabFilter
  counts?: Partial<Record<ProductsStatusTabFilter, number>>
  onChange: (value: ProductsStatusTabFilter) => void
}): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2 border-b border-border-subtle px-4 py-3">
      {STATUS_TAB_CONFIG.map((tab) => {
        const badge = counts?.[tab.id]
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={active === tab.id}
            aria-label={
              badge !== undefined ? `${tab.label}: ${badge} products.` : `${tab.label} filter`
            }
            title={tab.description}
            onClick={() => {
              onChange(tab.id)
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              active === tab.id
                ? "border-interactive-primary bg-surface-subtle text-content-primary"
                : "border-border-default bg-surface-default text-content-tertiary hover:text-content-secondary",
            )}
          >
            {tab.label}
            {badge !== undefined ? (
              <span className="text-3xs tabular-nums text-content-secondary">({badge})</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

function buildColumns(): ListColumnDef<ProductListRow, ProductColumnId>[] {
  return [
    {
      id: "thumbnail",
      header: "",
      sortable: false,
      headerClassName: "w-12 px-3",
      cellClassName: "w-12 px-3",
      renderCell: (row) => (
        <ProductThumbnail
          title={row.title}
          imageUrl={row.thumbnailUrl ?? undefined}
          hue={row.thumbnailHue}
          size={40}
        />
      ),
    },
    {
      id: "title",
      header: "Product",
      sortable: true,
      getSortValue: (row) => row.title,
      renderCell: (row) => (
        <Link
          to={`/products/${encodeURIComponent(row.id)}`}
          className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:underline"
        >
          {row.title}
        </Link>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      getSortValue: (row) => row.status,
      renderCell: (row) => <ProductStatusBadge status={row.status} />,
    },
    {
      id: "variantsCount",
      header: "Variants",
      sortable: false,
      cellClassName: "text-sm tabular-nums text-content-secondary",
      renderCell: (row) => row.variantsCount,
    },
    {
      id: "stockTotal",
      header: "Total stock",
      sortable: false,
      cellClassName: "text-sm tabular-nums text-content-secondary",
      renderCell: (row) => (typeof row.stockTotal === "number" ? row.stockTotal : "–"),
    },
    {
      id: "priceRange",
      header: "Price range",
      sortable: false,
      cellClassName: "text-sm tabular-nums text-content-secondary",
      renderCell: (row) => row.priceRangeLabel,
    },
    {
      id: "updatedAt",
      header: "Updated",
      sortable: true,
      getSortValue: (row) => new Date(row.updatedAt).getTime(),
      cellClassName: "text-sm text-content-tertiary",
      renderCell: (row) => (
        <time dateTime={row.updatedAt}>
          {new Date(row.updatedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </time>
      ),
    },
  ]
}

export function ProductListPage(): JSX.Element {
  const navigate = useNavigate()
  const hasBackend = resolveMedusaAdminBackendUrl() !== null

  const [statusTab, setStatusTab] = useState<ProductsStatusTabFilter>("all")
  const [searchDraft, setSearchDraft] = useState("")
  const debouncedSearch = useDebouncedValue(searchDraft, 300)
  const [page, setPage] = useState(1)
  const columns = useMemo(() => buildColumns(), [])

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
    debouncedSearch,
    statusTab,
    page,
    pageSize: LIST_PAGE_SIZE,
    sortColumn: filteredSortColumn,
    sortDirection: sortState.direction,
  })

  const rows = listQuery.data?.rows ?? []

  const onRequestSort = useCallback((columnId: ProductColumnId) => {
    if (!SORTABLE_PRODUCT_COLUMNS.has(columnId)) {
      return
    }
    setSortState((prev) => {
      if (prev.column !== columnId) {
        return {
          column: columnId,
          direction: columnId === "updatedAt" ? "desc" : "asc",
        }
      }
      if (prev.direction === "asc") {
        return { column: columnId, direction: "desc" }
      }
      if (prev.direction === "desc") {
        return { column: null, direction: "none" }
      }
      return {
        column: columnId,
        direction: columnId === "updatedAt" ? "desc" : "asc",
      }
    })
    setPage(1)
  }, [])

  const tabCountsMock = useMemo(() => {
    const titleFilter = debouncedSearch.trim().toLowerCase()
    let base = MOCK_PRODUCTS
    if (titleFilter.length > 0) {
      base = base.filter((product) => product.title.toLowerCase().includes(titleFilter))
    }

    function count(where: ProductsStatusTabFilter): number {
      if (where === "all") {
        return base.length
      }
      if (where === "active") {
        return base.filter((product) => product.status === "published").length
      }
      return base.filter((product) => product.status === "draft").length
    }

    return {
      all: count("all"),
      active: count("active"),
      draft: count("draft"),
    } satisfies Partial<Record<ProductsStatusTabFilter, number>>
  }, [debouncedSearch])

  const backendNotice = debouncedSearch !== searchDraft ? "Applying search…" : null

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
        destructive: false,
        onSelect: () => {
          window.alert("Inventory editing ships in Sprint 3 — use Medusa Dashboard until then.")
        },
      },
    ],
    [navigate],
  )

  const showingLabel = (): string => {
    if (!listQuery.isFetched) {
      return "…"
    }
    return `${listQuery.data?.totalCount ?? 0}`
  }

  const emptyBanner = (): JSX.Element => {
    if (listQuery.error instanceof Error) {
      return (
        <ListEmptyState
          title="Could not load catalogue"
          description={listQuery.error.message}
        />
      )
    }
    if (
      rows.length === 0 &&
      debouncedSearch.trim().length === 0 &&
      statusTab === "all"
    ) {
      return (
        <ListEmptyState
          title="No catalogue entries yet"
          description="Publish items in Medusa Admin to hydrate this read-only view automatically."
        />
      )
    }
    return (
      <ListEmptyState
        title="No matches"
        description="Try another keyword or switch between Active vs Draft tabs."
      />
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-md border border-border-default bg-surface-default">
        {/* Heading */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-interface font-semibold tracking-tight text-content-primary">
                Products
              </h1>
              <span className="rounded-md bg-surface-subtle px-2 py-0.5 text-3xs font-semibold tabular-nums text-content-tertiary">
                {showingLabel()}
              </span>
            </div>
            <p className="text-xs text-content-tertiary">
              {hasBackend
                ? "Live data arrives from GET /admin/products via `@medusajs/js-sdk` (session-aware fetch)."
                : "Mock catalogue — configure `VITE_MEDUSA_ADMIN_BACKEND_URL` to talk to Medusa locally."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/product-categories"
              className="text-sm font-medium text-content-secondary transition hover:text-accent"
            >
              Categories
            </Link>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                navigate("/products/new")
              }}
            >
              New product (mock flow)
            </Button>
          </div>
        </div>

        <StatusTabRail
          active={statusTab}
          counts={hasBackend ? undefined : tabCountsMock}
          onChange={(next) => {
            setStatusTab(next)
            setPage(1)
          }}
        />

        <div className="flex flex-wrap items-center gap-3 px-4 py-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1 md:max-w-md">
            <label
              className="text-xs font-semibold uppercase tracking-wide text-content-tertiary"
              htmlFor="product-admin-search-input"
            >
              Search titles
            </label>
            <Input
              id="product-admin-search-input"
              type="search"
              value={searchDraft}
              aria-describedby="product-admin-search-hint"
              onChange={(event) => {
                setSearchDraft(event.target.value)
                setPage(1)
              }}
              placeholder="Typing pauses updates for 300ms"
            />
            <p id="product-admin-search-hint" className="text-xs text-content-tertiary">
              {backendNotice ??
                `Server pagination returns ${LIST_PAGE_SIZE} catalogue rows per request.`}
            </p>
          </div>
        </div>

        <div className="border-t border-border-subtle">
          <div className="hidden md:block">
            <DataTable<ProductListRow, ProductColumnId>
              aria-label="MercFlow product catalogue results"
              columns={columns}
              data={rows}
              getRowId={(row) => row.id}
              sortState={sortState}
              onRequestSort={onRequestSort}
              getRowActions={getRowActions}
              hasRowActions
              isLoading={listQuery.isLoading || listQuery.isFetching}
              emptyState={emptyBanner()}
            />
          </div>

          <div className="md:hidden">
            {listQuery.isLoading || listQuery.isFetching ? (
              <div className="px-4 py-8 text-center text-sm text-content-tertiary">
                Loading catalogue…
              </div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-10 text-center">{emptyBanner()}</div>
            ) : (
              <ProductCardGrid rows={rows} />
            )}
          </div>
        </div>

        <ListPagination
          aria-label="MercFlow product pagination"
          currentPage={page}
          totalItems={listQuery.data?.totalCount ?? 0}
          pageSize={LIST_PAGE_SIZE}
          onPageChange={(value) => {
            setPage(value)
          }}
          onPageSizeChange={() => {}}
          pageSizeOptions={[LIST_PAGE_SIZE]}
        />
      </div>
    </div>
  )
}
