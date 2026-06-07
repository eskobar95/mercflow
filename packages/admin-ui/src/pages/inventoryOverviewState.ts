import type { ListSortState } from "@/components/ui/list/types"
import type {
  InventoryMovementDto,
  InventoryOverviewRowDto,
} from "@/features/inventory/inventoryOverviewAdminApi"

export type InventoryOverviewCol = "title" | "stocked" | "reserved" | "available" | "incoming"

export type InventoryOverviewState = {
  rows: InventoryOverviewRowDto[]
  count: number
  lowStockThreshold: number
  thresholdDraft: string
  search: string
  filter: "all" | "low_stock"
  page: number
  isLoading: boolean
  listError: string | null
  sort: ListSortState<InventoryOverviewCol>
  movementVariant: InventoryOverviewRowDto | null
  movements: InventoryMovementDto[]
  movementsLoading: boolean
  movementsError: string | null
}

export type InventoryOverviewAction =
  | { type: "loadStart" }
  | { type: "loadSuccess"; rows: InventoryOverviewRowDto[]; count: number; lowStockThreshold: number }
  | { type: "loadError"; message: string }
  | { type: "loadFinish" }
  | { type: "setSearch"; value: string }
  | { type: "setFilter"; value: "all" | "low_stock" }
  | { type: "setThresholdDraft"; value: string }
  | { type: "setPage"; page: number | ((prev: number) => number) }
  | { type: "setListError"; message: string | null }
  | { type: "cycleSort"; columnId: InventoryOverviewCol }
  | { type: "thresholdSaveSuccess"; lowStockThreshold: number }
  | { type: "openMovements"; variant: InventoryOverviewRowDto }
  | { type: "closeMovements" }
  | { type: "movementsLoadStart" }
  | { type: "movementsLoadSuccess"; movements: InventoryMovementDto[] }
  | { type: "movementsLoadError"; message: string }
  | { type: "movementsLoadFinish" }

export const INITIAL_INVENTORY_OVERVIEW_STATE: InventoryOverviewState = {
  rows: [],
  count: 0,
  lowStockThreshold: 5,
  thresholdDraft: "5",
  search: "",
  filter: "all",
  page: 1,
  isLoading: false,
  listError: null,
  sort: { column: "available", direction: "asc" },
  movementVariant: null,
  movements: [],
  movementsLoading: false,
  movementsError: null,
}

export function inventoryOverviewReducer(
  state: InventoryOverviewState,
  action: InventoryOverviewAction,
): InventoryOverviewState {
  switch (action.type) {
    case "loadStart":
      return { ...state, isLoading: true, listError: null }
    case "loadSuccess":
      return {
        ...state,
        rows: action.rows,
        count: action.count,
        lowStockThreshold: action.lowStockThreshold,
        thresholdDraft: String(action.lowStockThreshold),
      }
    case "loadError":
      return { ...state, listError: action.message }
    case "loadFinish":
      return { ...state, isLoading: false }
    case "setSearch":
      return { ...state, search: action.value, page: 1 }
    case "setFilter":
      return { ...state, filter: action.value, page: 1 }
    case "setThresholdDraft":
      return { ...state, thresholdDraft: action.value }
    case "setPage": {
      const nextPage =
        typeof action.page === "function" ? action.page(state.page) : action.page
      return { ...state, page: nextPage }
    }
    case "setListError":
      return { ...state, listError: action.message }
    case "cycleSort": {
      const { columnId } = action
      const { sort } = state
      if (sort.column !== columnId) {
        return { ...state, sort: { column: columnId, direction: "asc" }, page: 1 }
      }
      if (sort.direction === "asc") {
        return { ...state, sort: { column: columnId, direction: "desc" }, page: 1 }
      }
      if (sort.direction === "desc") {
        return { ...state, sort: { column: "available", direction: "asc" }, page: 1 }
      }
      return { ...state, sort: { column: columnId, direction: "asc" }, page: 1 }
    }
    case "thresholdSaveSuccess":
      return {
        ...state,
        lowStockThreshold: action.lowStockThreshold,
        thresholdDraft: String(action.lowStockThreshold),
      }
    case "openMovements":
      return {
        ...state,
        movementVariant: action.variant,
        movements: [],
        movementsError: null,
      }
    case "closeMovements":
      return { ...state, movementVariant: null }
    case "movementsLoadStart":
      return { ...state, movementsLoading: true }
    case "movementsLoadSuccess":
      return { ...state, movements: action.movements }
    case "movementsLoadError":
      return { ...state, movementsError: action.message }
    case "movementsLoadFinish":
      return { ...state, movementsLoading: false }
    default:
      return state
  }
}
