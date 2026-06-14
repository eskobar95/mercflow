import { type Dispatch, useCallback, useEffect, useMemo, useReducer } from "react"

import type { ListColumnDef, ListSortState } from "@/components/ui/list/types"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
import { formatSettingsCountryLabel } from "@/features/settings/settingsSelectOptions"
import {
  createTaxRegion,
  deleteTaxRegion,
  listTaxRegions,
  updateTaxRegionRate,
} from "@/features/settings/taxSettingsApi"
import type { TaxRegionRow } from "@/features/settings/types"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type TaxesCol = "country" | "name" | "rate"

type TaxesSettingsState = {
  rows: TaxRegionRow[]
  phase: "loading" | "ready" | "error"
  message: string | null
  sheetOpen: boolean
  sheetMode: "create" | "edit"
  editingRegion: TaxRegionRow | null
  saving: boolean
  sheetError: string | null
  deleteDialogOpen: boolean
  deletingRegion: TaxRegionRow | null
  deleting: boolean
  sort: ListSortState<TaxesCol>
}

type TaxesSettingsAction =
  | { type: "reloadStart" }
  | { type: "reloadSuccess"; rows: TaxRegionRow[] }
  | { type: "reloadError"; message: string }
  | { type: "openCreateSheet" }
  | { type: "openEditSheet"; region: TaxRegionRow }
  | { type: "closeSheet" }
  | { type: "saveStart" }
  | { type: "saveFinish" }
  | { type: "saveError"; message: string }
  | { type: "openDeleteDialog"; region: TaxRegionRow }
  | { type: "closeDeleteDialog" }
  | { type: "deleteStart" }
  | { type: "deleteFinish" }
  | { type: "deleteError"; message: string }
  | { type: "cycleSort"; columnId: TaxesCol }

const INITIAL_STATE: TaxesSettingsState = {
  rows: [],
  phase: "loading",
  message: null,
  sheetOpen: false,
  sheetMode: "create",
  editingRegion: null,
  saving: false,
  sheetError: null,
  deleteDialogOpen: false,
  deletingRegion: null,
  deleting: false,
  sort: { column: "country", direction: "asc" },
}

function formatRatePercent(rate: number | null): string {
  if (rate === null || !Number.isFinite(rate)) return "—"
  return `${rate}%`
}

function taxesSettingsReducer(state: TaxesSettingsState, action: TaxesSettingsAction): TaxesSettingsState {
  switch (action.type) {
    case "reloadStart":
      return { ...state, phase: "loading", message: null }
    case "reloadSuccess":
      return { ...state, rows: action.rows, phase: "ready" }
    case "reloadError":
      return { ...state, phase: "error", message: action.message }
    case "openCreateSheet":
      return { ...state, sheetOpen: true, sheetMode: "create", editingRegion: null, sheetError: null }
    case "openEditSheet":
      return { ...state, sheetOpen: true, sheetMode: "edit", editingRegion: action.region, sheetError: null }
    case "closeSheet":
      return { ...state, sheetOpen: false, editingRegion: null, sheetError: null }
    case "saveStart":
      return { ...state, saving: true, sheetError: null }
    case "saveFinish":
      return { ...state, saving: false, sheetOpen: false, editingRegion: null, sheetError: null }
    case "saveError":
      return { ...state, saving: false, sheetError: action.message }
    case "openDeleteDialog":
      return { ...state, deleteDialogOpen: true, deletingRegion: action.region, message: null }
    case "closeDeleteDialog":
      return { ...state, deleteDialogOpen: false, deletingRegion: null, deleting: false }
    case "deleteStart":
      return { ...state, deleting: true, message: null }
    case "deleteFinish":
      return { ...state, deleting: false, deleteDialogOpen: false, deletingRegion: null }
    case "deleteError":
      return { ...state, deleting: false, message: action.message }
    case "cycleSort": {
      const { columnId } = action
      const { sort } = state
      if (sort.column !== columnId) return { ...state, sort: { column: columnId, direction: "asc" } }
      if (sort.direction === "asc") return { ...state, sort: { column: columnId, direction: "desc" } }
      return { ...state, sort: { column: null, direction: "none" } }
    }
    default: {
      const _exhaustive: never = action
      return _exhaustive as TaxesSettingsState
    }
  }
}

export function useTaxesSettingsPage() {
  const [state, dispatch] = useReducer(taxesSettingsReducer, INITIAL_STATE)
  const hasBackend = resolveMedusaAdminBackendUrl() !== null

  const reload = useCallback(async (): Promise<void> => {
    if (!hasBackend) return
    dispatch({ type: "reloadStart" })
    try {
      dispatch({ type: "reloadSuccess", rows: await listTaxRegions() })
    } catch (error: unknown) {
      dispatch({
        type: "reloadError",
        message: error instanceof Error ? error.message : "Failed to load tax regions",
      })
    }
  }, [hasBackend])

  useEffect(() => { void reload() }, [reload])

  const columns = useMemo(
    (): ListColumnDef<TaxRegionRow, TaxesCol>[] => [
      {
        id: "country",
        header: "Country",
        sortable: true,
        getSortValue: (row) => row.countryCode,
        renderCell: (row) => formatSettingsCountryLabel(row.countryCode),
      },
      {
        id: "name",
        header: "Name",
        sortable: true,
        getSortValue: (row) => row.name.toLocaleLowerCase(),
        cellClassName: "font-medium",
        renderCell: (row) => row.name,
      },
      {
        id: "rate",
        header: "Rate",
        sortable: true,
        getSortValue: (row) => row.ratePercent ?? -1,
        renderCell: (row) => formatRatePercent(row.ratePercent),
      },
    ],
    [],
  )

  const { rows, sort } = state
  const sortedRows = useMemo((): TaxRegionRow[] => {
    if (sort.column === null || sort.direction === "none") return rows
    const col = columns.find((entry) => entry.id === sort.column)
    return rows.toSorted((left, right) => {
      const leftValue = col?.getSortValue?.(left) ?? ""
      const rightValue = col?.getSortValue?.(right) ?? ""
      const cmp =
        typeof leftValue === "number" && typeof rightValue === "number"
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue))
      return sort.direction === "asc" ? cmp : -cmp
    })
  }, [columns, rows, sort])

  const onRequestSort = useCallback((columnId: TaxesCol): void => {
    dispatch({ type: "cycleSort", columnId })
  }, [])

  const getRowActions = useCallback(
    (row: TaxRegionRow): RowActionItem[] => [
      { id: "edit", label: "Edit", onSelect: () => dispatch({ type: "openEditSheet", region: row }) },
      {
        id: "delete",
        label: "Delete",
        destructive: true,
        onSelect: () => dispatch({ type: "openDeleteDialog", region: row }),
      },
    ],
    [],
  )

  const submitCreate = async (input: { countryCode: string; name: string; ratePercent: number }): Promise<boolean> => {
    dispatch({ type: "saveStart" })
    try {
      await createTaxRegion(input)
      dispatch({ type: "saveFinish" })
      await reload()
      return true
    } catch (error: unknown) {
      dispatch({ type: "saveError", message: error instanceof Error ? error.message : "Failed to create tax region" })
      return false
    }
  }

  const submitUpdate = async (input: { rateId: string; name: string; ratePercent: number }): Promise<boolean> => {
    dispatch({ type: "saveStart" })
    try {
      await updateTaxRegionRate(input)
      dispatch({ type: "saveFinish" })
      await reload()
      return true
    } catch (error: unknown) {
      dispatch({ type: "saveError", message: error instanceof Error ? error.message : "Failed to update tax region" })
      return false
    }
  }

  const confirmDelete = async (): Promise<boolean> => {
    if (state.deletingRegion === null) return false
    dispatch({ type: "deleteStart" })
    try {
      await deleteTaxRegion(state.deletingRegion.id)
      dispatch({ type: "deleteFinish" })
      await reload()
      return true
    } catch (error: unknown) {
      dispatch({ type: "deleteError", message: error instanceof Error ? error.message : "Failed to delete tax region" })
      return false
    }
  }

  return {
    hasBackend,
    state,
    dispatch,
    columns,
    getRowActions,
    sortedRows,
    onRequestSort,
    reload,
    submitCreate,
    submitUpdate,
    confirmDelete,
  }
}
