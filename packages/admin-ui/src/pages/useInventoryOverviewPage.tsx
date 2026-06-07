import { useCallback, useEffect, useMemo, useReducer } from "react"

import type { ListColumnDef } from "@/components/ui/list/types"
import {
  listInventoryOverviewAdmin,
  listVariantMovementsAdmin,
  patchInventoryConfigAdmin,
  type InventoryOverviewRowDto,
  type InventoryOverviewSortColumn,
  type InventoryOverviewSortDirection,
} from "@/features/inventory/inventoryOverviewAdminApi"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import {
  INITIAL_INVENTORY_OVERVIEW_STATE,
  inventoryOverviewReducer,
  type InventoryOverviewCol,
} from "./inventoryOverviewState"

export function useInventoryOverviewPage() {
  const hasBackend = resolveMedusaAdminBackendUrl() !== null
  const [state, dispatch] = useReducer(
    inventoryOverviewReducer,
    INITIAL_INVENTORY_OVERVIEW_STATE,
  )

  const load = useCallback(async (): Promise<void> => {
    if (!hasBackend) {
      return
    }
    dispatch({ type: "loadStart" })
    try {
      const sortBy: InventoryOverviewSortColumn = state.sort.column ?? "available"
      const sortDir: InventoryOverviewSortDirection =
        state.sort.direction === "desc" ? "desc" : "asc"

      const result = await listInventoryOverviewAdmin({
        page: state.page,
        limit: 25,
        search: state.search,
        filter: state.filter,
        sortBy,
        sortDir,
      })
      dispatch({
        type: "loadSuccess",
        rows: result.rows,
        count: result.count,
        lowStockThreshold: result.low_stock_threshold,
      })
    } catch (e) {
      dispatch({
        type: "loadError",
        message: e instanceof Error ? e.message : "Failed to load inventory overview",
      })
    } finally {
      dispatch({ type: "loadFinish" })
    }
  }, [hasBackend, state.filter, state.page, state.search, state.sort.column, state.sort.direction])

  useEffect(() => {
    void load()
  }, [load])

  const columns: ListColumnDef<InventoryOverviewRowDto, InventoryOverviewCol>[] = useMemo(
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
    [],
  )

  const openMovements = useCallback(
    (row: InventoryOverviewRowDto): void => {
      dispatch({ type: "openMovements", variant: row })
      if (!hasBackend) {
        return
      }
      dispatch({ type: "movementsLoadStart" })
      void (async (): Promise<void> => {
        try {
          const list = await listVariantMovementsAdmin(row.variant_id)
          dispatch({ type: "movementsLoadSuccess", movements: list })
        } catch (e) {
          dispatch({
            type: "movementsLoadError",
            message: e instanceof Error ? e.message : "Failed to load movement history",
          })
        } finally {
          dispatch({ type: "movementsLoadFinish" })
        }
      })()
    },
    [hasBackend],
  )

  const saveThreshold = useCallback(async (): Promise<void> => {
    const parsed = Number.parseInt(state.thresholdDraft, 10)
    if (!Number.isFinite(parsed) || parsed < 0) {
      dispatch({
        type: "setListError",
        message: "Low-stock threshold must be a non-negative integer",
      })
      return
    }
    try {
      const saved = await patchInventoryConfigAdmin({ low_stock_threshold: parsed })
      dispatch({ type: "thresholdSaveSuccess", lowStockThreshold: saved })
      await load()
    } catch (e) {
      dispatch({
        type: "setListError",
        message: e instanceof Error ? e.message : "Failed to save threshold",
      })
    }
  }, [load, state.thresholdDraft])

  return {
    hasBackend,
    state,
    dispatch,
    columns,
    openMovements,
    saveThreshold,
  }
}
