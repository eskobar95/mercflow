import type { JSX } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListToolbar } from "@/components/ui/list/ListToolbar"
import type { ListColumnDef, ListSortState } from "@/components/ui/list/types"
import { compareSortValues } from "@/components/ui/list/types"
import { Sheet } from "@/components/ui/Sheet"
import { Input } from "@/components/ui/Input"
import {
  listInventoryOverviewAdmin,
  listVariantMovementsAdmin,
  patchInventoryConfigAdmin,
  type InventoryMovementDto,
  type InventoryOverviewRowDto,
} from "@/features/inventory/inventoryOverviewAdminApi"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type Col = "title" | "stocked" | "reserved" | "available" | "incoming"

export function InventoryOverviewPage(): JSX.Element {
  const hasBackend = resolveMedusaAdminBackendUrl() !== null
  const [rows, setRows] = useState<InventoryOverviewRowDto[]>([])
  const [count, setCount] = useState(0)
  const [lowStockThreshold, setLowStockThreshold] = useState(5)
  const [thresholdDraft, setThresholdDraft] = useState("5")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "low_stock">("all")
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [sort, setSort] = useState<ListSortState<Col>>({
    column: "available",
    direction: "asc",
  })
  const [movementVariant, setMovementVariant] = useState<InventoryOverviewRowDto | null>(
    null
  )
  const [movements, setMovements] = useState<InventoryMovementDto[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)
  const [movementsError, setMovementsError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    if (!hasBackend) {
      return
    }
    setIsLoading(true)
    setListError(null)
    try {
      const result = await listInventoryOverviewAdmin({
        page,
        limit: 25,
        search,
        filter,
      })
      setRows(result.rows)
      setCount(result.count)
      setLowStockThreshold(result.low_stock_threshold)
      setThresholdDraft(String(result.low_stock_threshold))
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load inventory overview")
    } finally {
      setIsLoading(false)
    }
  }, [filter, hasBackend, page, search])

  useEffect(() => {
    void load()
  }, [load])

  const columns: ListColumnDef<InventoryOverviewRowDto, Col>[] = useMemo(
    () => [
      {
        id: "title",
        header: "Variant",
        sortable: true,
        getSortValue: (row) => row.title,
        renderCell: (row) => (
          <div>
            <p className="font-medium text-content-primary">{row.title}</p>
            <p className="text-xs text-content-tertiary">{row.sku ?? row.variant_id}</p>
          </div>
        ),
      },
      {
        id: "stocked",
        header: "Stocked",
        sortable: true,
        getSortValue: (row) => row.stocked,
        renderCell: (row) => row.stocked,
      },
      {
        id: "reserved",
        header: "Reserved",
        sortable: true,
        getSortValue: (row) => row.reserved,
        renderCell: (row) => row.reserved,
      },
      {
        id: "available",
        header: "Available",
        sortable: true,
        getSortValue: (row) => row.available,
        renderCell: (row) => (
          <span className={row.is_low_stock ? "font-semibold text-status-warning" : undefined}>
            {row.available}
          </span>
        ),
      },
      {
        id: "incoming",
        header: "Incoming",
        sortable: true,
        getSortValue: (row) => row.incoming,
        renderCell: (row) => row.incoming,
      },
    ],
    []
  )

  const sortedRows = useMemo(() => {
    if (!sort.column || sort.direction === "none") {
      return rows
    }
    const def = columns.find((c) => c.id === sort.column)
    if (!def?.getSortValue) {
      return rows
    }
    const dir = sort.direction === "asc" ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = def.getSortValue?.(a)
      const bv = def.getSortValue?.(b)
      if (av === undefined || bv === undefined) {
        return 0
      }
      return compareSortValues(av as string | number, bv as string | number) * dir
    })
  }, [columns, rows, sort])

  const openMovements = useCallback(
    (row: InventoryOverviewRowDto): void => {
      setMovementVariant(row)
      setMovements([])
      setMovementsError(null)
      if (!hasBackend) {
        return
      }
      setMovementsLoading(true)
      void (async (): Promise<void> => {
        try {
          const list = await listVariantMovementsAdmin(row.variant_id)
          setMovements(list)
        } catch (e) {
          setMovementsError(
            e instanceof Error ? e.message : "Failed to load movement history"
          )
        } finally {
          setMovementsLoading(false)
        }
      })()
    },
    [hasBackend]
  )

  const saveThreshold = useCallback(async (): Promise<void> => {
    const parsed = Number.parseInt(thresholdDraft, 10)
    if (!Number.isFinite(parsed) || parsed < 0) {
      setListError("Low-stock threshold must be a non-negative integer")
      return
    }
    try {
      const saved = await patchInventoryConfigAdmin({ low_stock_threshold: parsed })
      setLowStockThreshold(saved)
      setThresholdDraft(String(saved))
      await load()
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to save threshold")
    }
  }, [load, thresholdDraft])

  if (!hasBackend) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">
          Configure <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code>{" "}
          to load inventory overview.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      <ListToolbar
        title="Inventory overview"
        description="Live available = stocked − reserved. Incoming sums open purchase orders."
        end={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/inventory/purchase-orders"
              className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
            >
              Purchase orders
            </Link>
            <Link
              to="/inventory/suppliers"
              className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
            >
              Suppliers
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border-default bg-surface-raised p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-content-primary">Search</span>
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Product, SKU, or variant id"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-content-primary">Filter</span>
          <select
            className="rounded-sm border border-border-default bg-surface-base px-3 py-2 text-sm"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value === "low_stock" ? "low_stock" : "all")
              setPage(1)
            }}
          >
            <option value="all">All variants</option>
            <option value="low_stock">Low stock only</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-content-primary">Low-stock threshold</span>
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              step={1}
              className="w-24"
              value={thresholdDraft}
              onChange={(event) => setThresholdDraft(event.target.value)}
            />
            <Button type="button" size="sm" onClick={() => void saveThreshold()}>
              Save
            </Button>
          </div>
        </label>
        <p className="text-xs text-content-tertiary">
          Highlight when available &lt; {lowStockThreshold}
        </p>
      </div>

      {listError ? <p className="text-sm text-status-error">{listError}</p> : null}

      <DataTable
        aria-label="Inventory overview"
        caption="Variant stock and incoming purchase orders"
        columns={columns}
        data={sortedRows}
        getRowId={(row) => row.variant_id}
        sortState={sort}
        onRequestSort={(columnId) => {
          setSort((s) => {
            if (s.column !== columnId) {
              return { column: columnId, direction: "asc" }
            }
            if (s.direction === "asc") {
              return { column: columnId, direction: "desc" }
            }
            if (s.direction === "desc") {
              return { column: null, direction: "none" }
            }
            return { column: columnId, direction: "asc" }
          })
        }}
        isLoading={isLoading}
        emptyState={
          <ListEmptyState
            title="No variants"
            description="Adjust search or filters, or add products in Medusa."
          />
        }
        getRowActions={(row) => [
          {
            id: "movements",
            label: "Movement history",
            onSelect: () => openMovements(row),
          },
        ]}
      />

      <p className="text-sm text-content-tertiary">
        Showing {rows.length} of {count} variants (page {page}).
      </p>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page <= 1 || isLoading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={rows.length === 0 || page * 25 >= count || isLoading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>

      <Sheet
        open={movementVariant !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMovementVariant(null)
          }
        }}
        title={movementVariant?.title ?? "Movement history"}
        description={
          movementVariant
            ? `SKU ${movementVariant.sku ?? movementVariant.variant_id}`
            : undefined
        }
      >
        {movementsLoading ? (
          <p className="text-sm text-content-secondary">Loading movements…</p>
        ) : null}
        {movementsError ? (
          <p className="text-sm text-status-error">{movementsError}</p>
        ) : null}
        {!movementsLoading && movements.length === 0 ? (
          <p className="text-sm text-content-secondary">
            No MercFlow movements yet. PO receipts appear here after you record a receive.
          </p>
        ) : null}
        <ul className="space-y-3">
          {movements.map((movement) => (
            <li
              key={movement.id}
              className="rounded-md border border-border-default bg-surface-subtle px-3 py-2 text-sm"
            >
              <p className="font-medium text-content-primary">{movement.label}</p>
              <p className="text-content-secondary">
                {movement.source.replace(/_/g, " ")} · +{movement.quantity} ·{" "}
                {new Date(movement.occurred_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  )
}
