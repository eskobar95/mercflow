import { type Dispatch, useCallback, useEffect, useMemo, useReducer } from "react"

import { PackagingTypeBadge } from "@/components/packaging/PackagingTypeBadge"
import type { ListColumnDef, ListSortState } from "@/components/ui/list/types"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
import { Switch } from "@/components/ui/Switch"
import {
  formatPackagingDimensions,
  formatPackagingWeightG,
} from "@/features/packaging/formatPackagingDisplay"
import {
  createPackagingTypeAdmin,
  deletePackagingTypeAdmin,
  listPackagingTypesAdmin,
  updatePackagingTypeAdmin,
} from "@/features/packaging/packagingTypesAdminApi"
import type {
  CreatePackagingTypeInput,
  PackagingTypeDto,
  UpdatePackagingTypeInput,
} from "@/features/packaging/types"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type PackagingCol = "name" | "type" | "dimensions" | "max_weight" | "is_active"

type PackagingSettingsState = {
  rows: PackagingTypeDto[]
  phase: "loading" | "ready" | "error"
  message: string | null
  sheetOpen: boolean
  sheetMode: "create" | "edit"
  editingPackagingType: PackagingTypeDto | null
  saving: boolean
  sheetError: string | null
  togglingId: string | null
  sort: ListSortState<PackagingCol>
}

type PackagingSettingsAction =
  | { type: "reloadStart" }
  | { type: "reloadSuccess"; rows: PackagingTypeDto[] }
  | { type: "reloadError"; message: string }
  | { type: "setMessage"; message: string | null }
  | { type: "openCreateSheet" }
  | { type: "openEditSheet"; packagingType: PackagingTypeDto }
  | { type: "closeSheet" }
  | { type: "saveStart" }
  | { type: "saveFinish" }
  | { type: "saveError"; message: string }
  | { type: "toggleStart"; id: string }
  | { type: "toggleFinish" }
  | { type: "toggleError"; message: string }
  | { type: "cycleSort"; columnId: PackagingCol }

const INITIAL_STATE: PackagingSettingsState = {
  rows: [],
  phase: "loading",
  message: null,
  sheetOpen: false,
  sheetMode: "create",
  editingPackagingType: null,
  saving: false,
  sheetError: null,
  togglingId: null,
  sort: { column: "name", direction: "asc" },
}

function packagingSettingsReducer(
  state: PackagingSettingsState,
  action: PackagingSettingsAction
): PackagingSettingsState {
  switch (action.type) {
    case "reloadStart":
      return { ...state, phase: "loading", message: null }
    case "reloadSuccess":
      return { ...state, rows: action.rows, phase: "ready" }
    case "reloadError":
      return { ...state, phase: "error", message: action.message }
    case "setMessage":
      return { ...state, message: action.message }
    case "openCreateSheet":
      return {
        ...state,
        sheetOpen: true,
        sheetMode: "create",
        editingPackagingType: null,
        sheetError: null,
      }
    case "openEditSheet":
      return {
        ...state,
        sheetOpen: true,
        sheetMode: "edit",
        editingPackagingType: action.packagingType,
        sheetError: null,
      }
    case "closeSheet":
      return { ...state, sheetOpen: false, editingPackagingType: null, sheetError: null }
    case "saveStart":
      return { ...state, saving: true, sheetError: null }
    case "saveFinish":
      return { ...state, saving: false, sheetOpen: false, editingPackagingType: null }
    case "saveError":
      return { ...state, saving: false, sheetError: action.message }
    case "toggleStart":
      return { ...state, togglingId: action.id, message: null }
    case "toggleFinish":
      return { ...state, togglingId: null }
    case "toggleError":
      return { ...state, togglingId: null, message: action.message }
    case "cycleSort": {
      const { columnId } = action
      const { sort } = state
      if (sort.column !== columnId) {
        return { ...state, sort: { column: columnId, direction: "asc" } }
      }
      if (sort.direction === "asc") {
        return { ...state, sort: { column: columnId, direction: "desc" } }
      }
      return { ...state, sort: { column: null, direction: "none" } }
    }
    default: {
      const _exhaustive: never = action
      return _exhaustive as PackagingSettingsState
    }
  }
}

export function usePackagingSettingsPage(): {
  hasBackend: boolean
  state: PackagingSettingsState
  dispatch: Dispatch<PackagingSettingsAction>
  columns: ListColumnDef<PackagingTypeDto, PackagingCol>[]
  getRowActions: (row: PackagingTypeDto) => RowActionItem[]
  sortedRows: PackagingTypeDto[]
  onRequestSort: (columnId: PackagingCol) => void
  reload: () => Promise<void>
  submitCreate: (payload: CreatePackagingTypeInput) => Promise<void>
  submitUpdate: (id: string, payload: UpdatePackagingTypeInput) => Promise<void>
  toggleActive: (row: PackagingTypeDto, nextActive: boolean) => Promise<void>
} {
  const [state, dispatch] = useReducer(packagingSettingsReducer, INITIAL_STATE)
  const hasBackend = resolveMedusaAdminBackendUrl() !== null

  const reload = useCallback(async (): Promise<void> => {
    if (!hasBackend) {
      return
    }
    dispatch({ type: "reloadStart" })
    try {
      const rows = await listPackagingTypesAdmin()
      dispatch({ type: "reloadSuccess", rows })
    } catch (err: unknown) {
      dispatch({
        type: "reloadError",
        message: err instanceof Error ? err.message : "Failed to load packaging types",
      })
    }
  }, [hasBackend])

  useEffect(() => {
    void reload()
  }, [reload])

  const toggleActive = useCallback(
    async (row: PackagingTypeDto, nextActive: boolean): Promise<void> => {
      dispatch({ type: "toggleStart", id: row.id })
      try {
        await updatePackagingTypeAdmin(row.id, { is_active: nextActive })
        dispatch({ type: "toggleFinish" })
        await reload()
      } catch (err: unknown) {
        dispatch({
          type: "toggleError",
          message: err instanceof Error ? err.message : "Failed to update status",
        })
      }
    },
    [reload]
  )

  const columns = useMemo(
    (): ListColumnDef<PackagingTypeDto, PackagingCol>[] => [
      {
        id: "name",
        header: "Name",
        sortable: true,
        getSortValue: (row) => row.name.toLocaleLowerCase(),
        cellClassName: "font-medium",
        renderCell: (row) => row.name,
      },
      {
        id: "type",
        header: "Type",
        sortable: true,
        getSortValue: (row) => row.type,
        renderCell: (row) => <PackagingTypeBadge type={row.type} />,
      },
      {
        id: "dimensions",
        header: "Dimensions",
        sortable: true,
        getSortValue: (row) => row.length_mm * row.width_mm * row.height_mm,
        renderCell: (row) => (
          <span className="text-content-secondary">{formatPackagingDimensions(row)}</span>
        ),
      },
      {
        id: "max_weight",
        header: "Max weight",
        sortable: true,
        getSortValue: (row) => row.max_weight_g,
        renderCell: (row) => formatPackagingWeightG(row.max_weight_g),
      },
      {
        id: "is_active",
        header: "Active",
        renderCell: (row) => (
          <Switch
            checked={row.is_active}
            disabled={state.togglingId === row.id}
            aria-label={`${row.is_active ? "Deactivate" : "Activate"} ${row.name}`}
            onCheckedChange={(checked) => {
              void toggleActive(row, checked)
            }}
          />
        ),
      },
    ],
    [state.togglingId, toggleActive]
  )

  const { rows, sort } = state

  const sortedRows = useMemo((): PackagingTypeDto[] => {
    if (sort.column === null || sort.direction === "none") {
      return rows
    }
    const col = columns.find((c) => c.id === sort.column)
    return rows.toSorted((a, b) => {
      const av = col?.getSortValue?.(a) ?? ""
      const bv = col?.getSortValue?.(b) ?? ""
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv))
      return sort.direction === "asc" ? cmp : -cmp
    })
  }, [columns, rows, sort])

  const onRequestSort = useCallback((columnId: PackagingCol): void => {
    dispatch({ type: "cycleSort", columnId })
  }, [])

  const getRowActions = useCallback(
    (row: PackagingTypeDto): RowActionItem[] => [
      {
        id: "edit",
        label: "Edit",
        onSelect: () => {
          dispatch({ type: "openEditSheet", packagingType: row })
        },
      },
      {
        id: "delete",
        label: "Delete",
        destructive: true,
        onSelect: () => {
          void (async (): Promise<void> => {
            try {
              await deletePackagingTypeAdmin(row.id)
              await reload()
            } catch (err: unknown) {
              dispatch({
                type: "setMessage",
                message: err instanceof Error ? err.message : "Delete failed",
              })
            }
          })()
        },
      },
    ],
    [reload]
  )

  const submitCreate = async (payload: CreatePackagingTypeInput): Promise<void> => {
    dispatch({ type: "saveStart" })
    try {
      await createPackagingTypeAdmin(payload)
      dispatch({ type: "saveFinish" })
      await reload()
    } catch (err: unknown) {
      dispatch({
        type: "saveError",
        message: err instanceof Error ? err.message : "Save failed",
      })
    }
  }

  const submitUpdate = async (
    id: string,
    payload: UpdatePackagingTypeInput
  ): Promise<void> => {
    dispatch({ type: "saveStart" })
    try {
      await updatePackagingTypeAdmin(id, payload)
      dispatch({ type: "saveFinish" })
      await reload()
    } catch (err: unknown) {
      dispatch({
        type: "saveError",
        message: err instanceof Error ? err.message : "Save failed",
      })
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
    toggleActive,
  }
}
