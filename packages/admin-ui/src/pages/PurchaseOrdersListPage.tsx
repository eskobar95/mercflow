import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useReducer } from "react"
import { Link, useNavigate } from "react-router-dom"

import { PoStatusBadge } from "@/components/inventory/PoStatusBadge"
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
  listPurchaseOrdersAdmin,
  updatePurchaseOrderStatusAdmin,
} from "@/features/inventory/purchaseOrdersAdminApi"
import type { PurchaseOrderDto } from "@/features/inventory/types"
import { listSuppliersAdmin } from "@/features/inventory/suppliersAdminApi"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type Col = "reference" | "status" | "supplier" | "expected_date"

type PurchaseOrdersListState = {
  rows: PurchaseOrderDto[]
  supplierNames: Record<string, string>
  isLoading: boolean
  listError: string | null
  sort: ListSortState<Col>
}

type PurchaseOrdersListAction =
  | { type: "loadStart" }
  | { type: "loadSuccess"; rows: PurchaseOrderDto[]; supplierNames: Record<string, string> }
  | { type: "loadError"; message: string }
  | { type: "loadFinish" }
  | { type: "setListError"; message: string | null }
  | { type: "cycleSort"; columnId: Col }

const INITIAL_PURCHASE_ORDERS_LIST_STATE: PurchaseOrdersListState = {
  rows: [],
  supplierNames: {},
  isLoading: false,
  listError: null,
  sort: { column: "reference", direction: "desc" },
}

function purchaseOrdersListReducer(
  state: PurchaseOrdersListState,
  action: PurchaseOrdersListAction,
): PurchaseOrdersListState {
  switch (action.type) {
    case "loadStart":
      return { ...state, isLoading: true, listError: null }
    case "loadSuccess":
      return {
        ...state,
        rows: action.rows,
        supplierNames: action.supplierNames,
      }
    case "loadError":
      return { ...state, listError: action.message }
    case "loadFinish":
      return { ...state, isLoading: false }
    case "setListError":
      return { ...state, listError: action.message }
    case "cycleSort": {
      const { columnId } = action
      const { sort } = state
      if (sort.column !== columnId) {
        return { ...state, sort: { column: columnId, direction: "asc" } }
      }
      if (sort.direction === "asc") {
        return { ...state, sort: { column: columnId, direction: "desc" } }
      }
      if (sort.direction === "desc") {
        return { ...state, sort: { column: null, direction: "none" } }
      }
      return { ...state, sort: { column: columnId, direction: "asc" } }
    }
    default:
      return state
  }
}

export function PurchaseOrdersListPage(): ReactNode {
  const navigate = useNavigate()
  const hasBackend = resolveMedusaAdminBackendUrl() !== null
  const [state, dispatch] = useReducer(
    purchaseOrdersListReducer,
    INITIAL_PURCHASE_ORDERS_LIST_STATE,
  )
  const { rows, supplierNames, isLoading, listError, sort } = state

  const load = useCallback(async (): Promise<void> => {
    if (!hasBackend) {
      return
    }
    dispatch({ type: "loadStart" })
    try {
      const [orders, suppliers] = await Promise.all([
        listPurchaseOrdersAdmin(),
        listSuppliersAdmin(),
      ])
      const map: Record<string, string> = {}
      for (const s of suppliers) {
        map[s.id] = s.name
      }
      dispatch({ type: "loadSuccess", rows: orders, supplierNames: map })
    } catch (e) {
      dispatch({
        type: "loadError",
        message: e instanceof Error ? e.message : "Failed to load purchase orders",
      })
    } finally {
      dispatch({ type: "loadFinish" })
    }
  }, [hasBackend])

  useEffect(() => {
    void load()
  }, [load])

  const columns: ListColumnDef<PurchaseOrderDto, Col>[] = useMemo(
    () => [
      {
        id: "reference",
        header: "Reference",
        sortable: true,
        getSortValue: (row) => row.reference ?? row.id,
        renderCell: (row) => (
          <span className="font-medium">{row.reference ?? row.id}</span>
        ),
      },
      {
        id: "supplier",
        header: "Supplier",
        sortable: true,
        getSortValue: (row) => supplierNames[row.supplier_id] ?? row.supplier_id,
        renderCell: (row) => supplierNames[row.supplier_id] ?? row.supplier_id,
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        getSortValue: (row) => row.status,
        renderCell: (row) => <PoStatusBadge status={row.status} />,
      },
      {
        id: "expected_date",
        header: "Expected",
        sortable: true,
        getSortValue: (row) =>
          row.expected_date ? new Date(row.expected_date).getTime() : 0,
        renderCell: (row) =>
          row.expected_date ? (
            <time dateTime={row.expected_date}>
              {new Date(row.expected_date).toLocaleDateString()}
            </time>
          ) : (
            <span className="text-content-secondary">—</span>
          ),
      },
    ],
    [supplierNames]
  )

  const onRequestSort = useCallback((columnId: Col): void => {
    dispatch({ type: "cycleSort", columnId })
  }, [])

  const sortedRows = useMemo(() => {
    if (!sort.column || sort.direction === "none") {
      return rows
    }
    const def = columns.find((c) => c.id === sort.column)
    if (!def?.getSortValue) {
      return rows
    }
    const dir = sort.direction === "asc" ? 1 : -1
    return rows.toSorted((a, b) => {
      const av = def.getSortValue?.(a)
      const bv = def.getSortValue?.(b)
      if (av === undefined || bv === undefined) {
        return 0
      }
      return compareSortValues(av as string | number, bv as string | number) * dir
    })
  }, [columns, rows, sort])

  const getRowActions = useCallback(
    (row: PurchaseOrderDto): RowActionItem[] => {
      const actions: RowActionItem[] = []
      if (row.status === "draft") {
        actions.push({
          id: "mark-ordered",
          label: "Mark as ordered",
          onSelect: () => {
            void (async (): Promise<void> => {
              try {
                await updatePurchaseOrderStatusAdmin(row.id, "ordered")
                await load()
              } catch (e) {
                dispatch({
                  type: "setListError",
                  message: e instanceof Error ? e.message : "Status update failed",
                })
              }
            })()
          },
        })
      }
      if (row.status === "ordered" || row.status === "partially_received") {
        actions.push({
          id: "receive",
          label: "Receive goods",
          onSelect: () => {
            navigate(`/inventory/purchase-orders/${encodeURIComponent(row.id)}/receive`)
          },
        })
      }
      return actions
    },
    [load, navigate]
  )

  if (!hasBackend) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-secondary">
          Configure <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code>{" "}
          to load purchase orders.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      <ListToolbar
        title="Purchase orders"
        description="Create POs, mark as ordered, and record receipts when goods arrive."
        end={
          <Button type="button" onClick={() => navigate("/inventory/purchase-orders/new")}>
            New purchase order
          </Button>
        }
      />
      {listError ? <p className="text-sm text-status-error">{listError}</p> : null}
      <DataTable
        aria-label="Purchase orders"
        caption="MercFlow purchase orders"
        columns={columns}
        data={sortedRows}
        getRowId={(row) => row.id}
        sortState={sort}
        onRequestSort={onRequestSort}
        getRowActions={getRowActions}
        isLoading={isLoading}
        emptyState={
          <ListEmptyState
            title="No purchase orders"
            description="Create a purchase order linked to a supplier."
            action={
              <Button
                type="button"
                onClick={() => navigate("/inventory/purchase-orders/new")}
              >
                New purchase order
              </Button>
            }
          />
        }
      />
      <p className="text-center text-sm text-content-tertiary">
        <Link
          to="/inventory/suppliers"
          className="font-medium text-interactive-primary hover:text-interactive-primary-hover"
        >
          Manage suppliers
        </Link>
      </p>
    </div>
  )
}
