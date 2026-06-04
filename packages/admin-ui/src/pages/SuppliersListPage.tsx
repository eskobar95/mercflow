import type { JSX } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListToolbar } from "@/components/ui/list/ListToolbar"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
import {
  compareSortValues,
  type ListColumnDef,
  type ListSortState,
} from "@/components/ui/list/types"
import {
  deleteSupplierAdmin,
  listSuppliersAdmin,
} from "@/features/inventory/suppliersAdminApi"
import type { SupplierDto } from "@/features/inventory/types"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type Col = "name" | "country" | "currency"

const COLUMNS: ListColumnDef<SupplierDto, Col>[] = [
  {
    id: "name",
    header: "Name",
    sortable: true,
    getSortValue: (row) => row.name.toLocaleLowerCase(),
    cellClassName: "font-medium",
    renderCell: (row) => (
      <Link
        to={`/inventory/suppliers/${encodeURIComponent(row.id)}`}
        className="text-text-link hover:underline"
      >
        {row.name}
      </Link>
    ),
  },
  {
    id: "country",
    header: "Country",
    sortable: true,
    getSortValue: (row) => row.country ?? "",
    renderCell: (row) => row.country ?? "—",
  },
  {
    id: "currency",
    header: "Currency",
    sortable: true,
    getSortValue: (row) => row.currency ?? "",
    renderCell: (row) => row.currency ?? "—",
  },
]

export function SuppliersListPage(): JSX.Element {
  const navigate = useNavigate()
  const hasBackend = resolveMedusaAdminBackendUrl() !== null
  const [rows, setRows] = useState<SupplierDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [sort, setSort] = useState<ListSortState<Col>>({ column: "name", direction: "asc" })

  const load = useCallback(async (): Promise<void> => {
    if (!hasBackend) {
      return
    }
    setIsLoading(true)
    setListError(null)
    try {
      setRows(await listSuppliersAdmin())
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load suppliers")
    } finally {
      setIsLoading(false)
    }
  }, [hasBackend])

  useEffect(() => {
    void load()
  }, [load])

  const onRequestSort = useCallback((columnId: Col) => {
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
  }, [])

  const sortedRows = useMemo(() => {
    if (!sort.column || sort.direction === "none") {
      return rows
    }
    const def = COLUMNS.find((c) => c.id === sort.column)
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
  }, [rows, sort])

  const getRowActions = useCallback(
    (row: SupplierDto): RowActionItem[] => [
      {
        id: "edit",
        label: "Edit",
        onSelect: () => {
          navigate(`/inventory/suppliers/${encodeURIComponent(row.id)}`)
        },
      },
      {
        id: "delete",
        label: "Delete",
        destructive: true,
        onSelect: () => {
          void (async (): Promise<void> => {
            try {
              await deleteSupplierAdmin(row.id)
              await load()
            } catch (e) {
              setListError(e instanceof Error ? e.message : "Delete failed")
            }
          })()
        },
      },
    ],
    [load, navigate]
  )

  if (!hasBackend) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-secondary">
          Configure <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code>{" "}
          to load suppliers.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      <ListToolbar
        title="Suppliers"
        description="Supplier register for purchase orders."
        end={
          <Button type="button" onClick={() => navigate("/inventory/suppliers/new")}>
            New supplier
          </Button>
        }
      />
      {listError ? <p className="text-sm text-status-error">{listError}</p> : null}
      <DataTable
        aria-label="Suppliers"
        caption="MercFlow suppliers"
        columns={COLUMNS}
        data={sortedRows}
        getRowId={(row) => row.id}
        sortState={sort}
        onRequestSort={onRequestSort}
        getRowActions={getRowActions}
        isLoading={isLoading}
        emptyState={
          <ListEmptyState
            title="No suppliers yet"
            description="Add a supplier to use in purchase orders."
            action={
              <Button type="button" onClick={() => navigate("/inventory/suppliers/new")}>
                New supplier
              </Button>
            }
          />
        }
      />
    </div>
  )
}
