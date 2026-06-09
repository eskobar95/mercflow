import { type Dispatch, useCallback, useEffect, useMemo, useReducer } from "react"

import type { ListColumnDef, ListSortState } from "@/components/ui/list/types"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
import { MetafieldTypeBadge } from "@/components/metafields/MetafieldTypeBadge"
import {
  createMetafieldDefinition,
  deleteMetafieldDefinition,
  listMetafieldDefinitions,
  updateMetafieldDefinition,
} from "@/features/metafields/metafieldDefinitionsApi"
import type {
  CreateMetafieldDefinitionPayload,
  CustomDataEntityKey,
  CustomDataListTab,
  MetafieldDefinitionDto,
  MetafieldOwnerType,
  UpdateMetafieldDefinitionPayload,
} from "@/features/metafields/types"
import { useAdminProductCategories } from "@/features/product-categories/useAdminProductCategories"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type DefinitionCol = "name" | "type" | "usage"

type CustomDataSettingsState = {
  entity: CustomDataEntityKey
  listTab: CustomDataListTab
  categoryFilterId: string
  rows: MetafieldDefinitionDto[]
  phase: "loading" | "ready" | "error"
  message: string | null
  sheetOpen: boolean
  sheetMode: "create" | "edit"
  editingDefinition: MetafieldDefinitionDto | null
  saving: boolean
  sheetError: string | null
  sort: ListSortState<DefinitionCol>
}

type CustomDataSettingsAction =
  | { type: "setEntity"; entity: CustomDataEntityKey }
  | { type: "setListTab"; tab: CustomDataListTab }
  | { type: "setCategoryFilterId"; categoryId: string }
  | { type: "reloadStart" }
  | { type: "reloadSuccess"; rows: MetafieldDefinitionDto[] }
  | { type: "reloadError"; message: string }
  | { type: "setMessage"; message: string | null }
  | { type: "openCreateSheet" }
  | { type: "openEditSheet"; definition: MetafieldDefinitionDto }
  | { type: "closeSheet" }
  | { type: "saveStart" }
  | { type: "saveFinish" }
  | { type: "saveError"; message: string }
  | { type: "cycleSort"; columnId: DefinitionCol }

const INITIAL_STATE: CustomDataSettingsState = {
  entity: "product",
  listTab: "all",
  categoryFilterId: "",
  rows: [],
  phase: "loading",
  message: null,
  sheetOpen: false,
  sheetMode: "create",
  editingDefinition: null,
  saving: false,
  sheetError: null,
  sort: { column: "name", direction: "asc" },
}

function entityToOwnerType(entity: CustomDataEntityKey): MetafieldOwnerType | null {
  if (entity === "product") {
    return "product"
  }
  if (entity === "category") {
    return "category"
  }
  return null
}

function customDataSettingsReducer(
  state: CustomDataSettingsState,
  action: CustomDataSettingsAction
): CustomDataSettingsState {
  switch (action.type) {
    case "setEntity":
      return {
        ...state,
        entity: action.entity,
        listTab: "all",
        categoryFilterId: "",
        message: null,
      }
    case "setListTab":
      return { ...state, listTab: action.tab, message: null }
    case "setCategoryFilterId":
      return { ...state, categoryFilterId: action.categoryId, message: null }
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
        editingDefinition: null,
        sheetError: null,
      }
    case "openEditSheet":
      return {
        ...state,
        sheetOpen: true,
        sheetMode: "edit",
        editingDefinition: action.definition,
        sheetError: null,
      }
    case "closeSheet":
      return { ...state, sheetOpen: false, editingDefinition: null, sheetError: null }
    case "saveStart":
      return { ...state, saving: true, sheetError: null }
    case "saveFinish":
      return { ...state, saving: false, sheetOpen: false, editingDefinition: null }
    case "saveError":
      return { ...state, saving: false, sheetError: action.message }
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
    default:
      return state
  }
}

function usageLabel(entity: CustomDataEntityKey): string {
  if (entity === "category") {
    return "Used in — categories"
  }
  return "Used in — products"
}

export function useCustomDataSettingsPage(): {
  hasBackend: boolean
  state: CustomDataSettingsState
  dispatch: Dispatch<CustomDataSettingsAction>
  ownerType: MetafieldOwnerType
  entityLabel: string
  listTabLabel: string
  showByCategoryTab: boolean
  requireCategoryConstraint: boolean
  canLoadDefinitions: boolean
  columns: ListColumnDef<MetafieldDefinitionDto, DefinitionCol>[]
  getRowActions: (row: MetafieldDefinitionDto) => RowActionItem[]
  sortedRows: MetafieldDefinitionDto[]
  onRequestSort: (columnId: DefinitionCol) => void
  reload: () => Promise<void>
  submitCreate: (payload: CreateMetafieldDefinitionPayload) => Promise<void>
  submitUpdate: (id: string, payload: UpdateMetafieldDefinitionPayload) => Promise<void>
  categoryRows: ReturnType<typeof useAdminProductCategories>["filteredRows"]
} {
  const [state, dispatch] = useReducer(customDataSettingsReducer, INITIAL_STATE)
  const hasBackend = resolveMedusaAdminBackendUrl() !== null
  const categories = useAdminProductCategories()
  const ownerType = entityToOwnerType(state.entity) ?? "product"

  const entityLabel = state.entity === "category" ? "categories" : "products"
  const listTabLabel =
    state.listTab === "all" ? `All ${entityLabel}` : "By category"
  const showByCategoryTab = state.entity === "product"
  const requireCategoryConstraint = state.listTab === "by_category"
  const canLoadDefinitions =
    state.listTab !== "by_category" || state.categoryFilterId.trim() !== ""

  const reload = useCallback(async (): Promise<void> => {
    if (!hasBackend) {
      return
    }
    if (!canLoadDefinitions) {
      dispatch({ type: "reloadSuccess", rows: [] })
      return
    }

    dispatch({ type: "reloadStart" })
    try {
      const rows = await listMetafieldDefinitions({
        ownerType,
        categoryId:
          state.listTab === "by_category" ? state.categoryFilterId : undefined,
      })
      dispatch({ type: "reloadSuccess", rows })
    } catch (err: unknown) {
      dispatch({
        type: "reloadError",
        message: err instanceof Error ? err.message : "Failed to load definitions",
      })
    }
  }, [canLoadDefinitions, hasBackend, ownerType, state.categoryFilterId, state.listTab])

  useEffect(() => {
    void reload()
  }, [reload])

  const columns = useMemo(
    (): ListColumnDef<MetafieldDefinitionDto, DefinitionCol>[] => [
      {
        id: "name",
        header: "Name",
        renderCell: (row) => (
          <div>
            <p className="font-medium text-content-primary">{row.name}</p>
            <p className="text-xs text-content-tertiary">
              {row.namespace}.{row.key}
            </p>
          </div>
        ),
        getSortValue: (row) => row.name,
        sortable: true,
      },
      {
        id: "type",
        header: "Type",
        renderCell: (row) => <MetafieldTypeBadge type={row.type} />,
        getSortValue: (row) => row.type,
        sortable: true,
      },
      {
        id: "usage",
        header: "Usage",
        renderCell: () => (
          <span className="text-sm text-content-secondary">{usageLabel(state.entity)}</span>
        ),
      },
    ],
    [state.entity]
  )

  const { rows, sort } = state

  const sortedRows = useMemo((): MetafieldDefinitionDto[] => {
    if (sort.column === null || sort.direction === "none") {
      return rows
    }
    const col = columns.find((c) => c.id === sort.column)
    return rows.toSorted((a, b) => {
      const av = col?.getSortValue?.(a) ?? ""
      const bv = col?.getSortValue?.(b) ?? ""
      const cmp = String(av).localeCompare(String(bv))
      return sort.direction === "asc" ? cmp : -cmp
    })
  }, [columns, rows, sort])

  const onRequestSort = useCallback((columnId: DefinitionCol): void => {
    dispatch({ type: "cycleSort", columnId })
  }, [])

  const getRowActions = useCallback(
    (row: MetafieldDefinitionDto): RowActionItem[] => [
      {
        id: "edit",
        label: "Edit",
        onSelect: () => {
          dispatch({ type: "openEditSheet", definition: row })
        },
      },
      {
        id: "delete",
        label: "Delete",
        destructive: true,
        onSelect: () => {
          void (async (): Promise<void> => {
            try {
              await deleteMetafieldDefinition(row.id)
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

  const submitCreate = async (payload: CreateMetafieldDefinitionPayload): Promise<void> => {
    dispatch({ type: "saveStart" })
    try {
      await createMetafieldDefinition(payload)
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
    payload: UpdateMetafieldDefinitionPayload
  ): Promise<void> => {
    dispatch({ type: "saveStart" })
    try {
      await updateMetafieldDefinition(id, payload)
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
    ownerType,
    entityLabel,
    listTabLabel,
    showByCategoryTab,
    requireCategoryConstraint,
    canLoadDefinitions,
    columns,
    getRowActions,
    sortedRows,
    onRequestSort,
    reload,
    submitCreate,
    submitUpdate,
    categoryRows: categories.filteredRows,
  }
}
