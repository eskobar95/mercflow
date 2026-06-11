import { useCallback, useMemo, useReducer } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import type { SortDirection } from "@/components/ui/list/ListSortControl"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
import type { ListSortState } from "@/components/ui/list/types"

import {
  bulkMarkFulfillmentReady,
  orderListRowEligibleForBulkFulfillment,
} from "@/features/orders/orderListBulkFulfillment"
import { deriveOrderFilterBuckets } from "@/features/orders/orderFilterCategories"
import type { OrdersListSortColumn } from "@/features/orders/orderListSortValues"
import {
  buildOrdersListDetailPath,
  parseOrdersListSearchParams,
  type OrdersListUrlSnapshot,
} from "@/features/orders/ordersListUrlState"
import type { OrderListRow } from "@/features/orders/orderTypes"
import { useListFilters } from "@/hooks/useListFilters"
import { useListRowSelection } from "@/hooks/useListRowSelection"
import { useOrdersList } from "@/hooks/useOrdersList"

type OrdersListUiState = {
  dateFrom: string
  dateTo: string
  bulkLoading: boolean
  bulkMessage: string | null
  page: number
  pageSize: number
  sort: ListSortState<OrdersListSortColumn>
}

type OrdersListUiAction =
  | { type: "setDateFrom"; value: string }
  | { type: "setDateTo"; value: string }
  | { type: "setPage"; page: number }
  | { type: "setPageSize"; pageSize: number }
  | { type: "setSort"; sort: ListSortState<OrdersListSortColumn> }
  | { type: "cycleSort"; columnId: OrdersListSortColumn }
  | { type: "bulkStart" }
  | { type: "bulkFinish"; message: string | null }
  | { type: "clearDates" }

const INITIAL_SORT: ListSortState<OrdersListSortColumn> = {
  column: "createdAt",
  direction: "desc",
}

const INITIAL_UI_STATE: OrdersListUiState = {
  dateFrom: "",
  dateTo: "",
  bulkLoading: false,
  bulkMessage: null,
  page: 1,
  pageSize: 10,
  sort: INITIAL_SORT,
}

function buildInitialUiState(searchParams: URLSearchParams): OrdersListUiState {
  const parsed = parseOrdersListSearchParams(searchParams)
  return {
    ...INITIAL_UI_STATE,
    page: parsed.page ?? INITIAL_UI_STATE.page,
    pageSize: parsed.pageSize ?? INITIAL_UI_STATE.pageSize,
    dateFrom: parsed.dateFrom ?? INITIAL_UI_STATE.dateFrom,
    dateTo: parsed.dateTo ?? INITIAL_UI_STATE.dateTo,
    sort: parsed.sort ?? INITIAL_UI_STATE.sort,
  }
}

function buildInitialFilters(searchParams: URLSearchParams): {
  searchDraft: string
  activeFilters: ReturnType<typeof useListFilters>["activeFilters"]
} {
  const parsed = parseOrdersListSearchParams(searchParams)
  return {
    searchDraft: parsed.search ?? "",
    activeFilters: parsed.activeFilters ?? [],
  }
}

function ordersListUiReducer(
  state: OrdersListUiState,
  action: OrdersListUiAction,
): OrdersListUiState {
  switch (action.type) {
    case "setDateFrom":
      return { ...state, dateFrom: action.value, page: 1 }
    case "setDateTo":
      return { ...state, dateTo: action.value, page: 1 }
    case "setPage":
      return { ...state, page: action.page }
    case "setPageSize":
      return { ...state, pageSize: action.pageSize, page: 1 }
    case "setSort":
      return { ...state, sort: action.sort, page: 1 }
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
        return { ...state, sort: { column: null, direction: "none" }, page: 1 }
      }
      return { ...state, sort: { column: columnId, direction: "asc" }, page: 1 }
    }
    case "bulkStart":
      return { ...state, bulkLoading: true, bulkMessage: null }
    case "bulkFinish":
      return { ...state, bulkLoading: false, bulkMessage: action.message }
    case "clearDates":
      return { ...state, dateFrom: "", dateTo: "", page: 1 }
    default:
      return state
  }
}

export type OrdersListPageModel = ReturnType<typeof useOrdersListPageModel>

export function useOrdersListPageModel(): {
  filters: ReturnType<typeof useListFilters>
  rows: OrderListRow[]
  isLoading: boolean
  errorMessage: string | null
  refetch: () => void
  totalFiltered: number
  selectedIds: Set<string>
  selection: ReturnType<typeof useListRowSelection>["selection"]
  clearSelection: () => void
  ui: OrdersListUiState
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setDateFrom: (value: string) => void
  setDateTo: (value: string) => void
  onRequestSort: (columnId: OrdersListSortColumn) => void
  onSortControlChange: (column: OrdersListSortColumn, direction: SortDirection) => void
  runBulkFulfillment: () => Promise<void>
  getRowActions: (row: OrderListRow) => RowActionItem[]
  buildOrderDetailPath: (orderId: string) => string
  resetAllFilters: () => void
  clearFilterDates: () => void
  sortControlColumn: OrdersListSortColumn
  sortControlDirection: SortDirection
  resetPage: () => void
} {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialFilters = useMemo(() => buildInitialFilters(searchParams), [searchParams])
  const [ui, dispatch] = useReducer(
    ordersListUiReducer,
    searchParams,
    buildInitialUiState,
  )

  const resetPage = useCallback((): void => {
    dispatch({ type: "setPage", page: 1 })
  }, [])

  const filters = useListFilters({
    onPageReset: resetPage,
    debounceMs: 300,
    initialSearchDraft: initialFilters.searchDraft,
    initialActiveFilters: initialFilters.activeFilters,
  })

  const { statusBucket, paymentBucket } = useMemo(
    () => deriveOrderFilterBuckets(filters.activeFilters),
    [filters.activeFilters],
  )

  const { rows, isLoading, errorMessage, refetch, totalFiltered } = useOrdersList({
    debouncedSearch: filters.debouncedSearch,
    statusBucket,
    paymentBucket,
    dateFrom: ui.dateFrom,
    dateTo: ui.dateTo,
    page: ui.page,
    pageSize: ui.pageSize,
    sort: ui.sort,
  })

  const rowIds = useMemo(() => rows.map((row) => row.id), [rows])
  const bulkEligibleRowIds = useMemo(() => {
    const ids: string[] = []
    for (const row of rows) {
      if (orderListRowEligibleForBulkFulfillment(row)) {
        ids.push(row.id)
      }
    }
    return ids
  }, [rows])

  const { selectedIds, selection, clearSelection } = useListRowSelection(
    rowIds,
    [
      ui.page,
      filters.debouncedSearch,
      statusBucket,
      paymentBucket,
      ui.dateFrom,
      ui.dateTo,
      ui.sort,
    ],
    {
      selectAllIds: bulkEligibleRowIds,
      selectAllMerge: true,
      deselectAllPageScoped: true,
    },
  )

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.has(row.id)),
    [rows, selectedIds],
  )

  const onRequestSort = useCallback((columnId: OrdersListSortColumn): void => {
    dispatch({ type: "cycleSort", columnId })
  }, [])

  const sortControlColumn: OrdersListSortColumn = ui.sort.column ?? "createdAt"
  const sortControlDirection: SortDirection = ui.sort.direction === "asc" ? "asc" : "desc"

  const onSortControlChange = useCallback(
    (column: OrdersListSortColumn, direction: SortDirection): void => {
      dispatch({ type: "setSort", sort: { column, direction } })
    },
    [],
  )

  const runBulkFulfillment = useCallback(async (): Promise<void> => {
    dispatch({ type: "bulkStart" })
    try {
      const results = await bulkMarkFulfillmentReady(selectedRows)
      const okCount = results.filter((result) => result.ok).length
      const failCount = results.length - okCount
      dispatch({
        type: "bulkFinish",
        message:
          failCount === 0
            ? `Created fulfillment for ${okCount} order(s).`
            : `${okCount} succeeded, ${failCount} skipped or failed.`,
      })
      refetch()
      clearSelection()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bulk fulfillment failed"
      dispatch({ type: "bulkFinish", message })
    }
  }, [clearSelection, refetch, selectedRows])

  const clearFilterDates = useCallback((): void => {
    dispatch({ type: "clearDates" })
  }, [])

  const resetAllFilters = useCallback((): void => {
    filters.clearAllFilters()
    dispatch({ type: "clearDates" })
  }, [filters])

  const setPage = useCallback((page: number): void => {
    dispatch({ type: "setPage", page })
  }, [])

  const setPageSize = useCallback((pageSize: number): void => {
    dispatch({ type: "setPageSize", pageSize })
  }, [])

  const setDateFrom = useCallback((value: string): void => {
    dispatch({ type: "setDateFrom", value })
  }, [])

  const setDateTo = useCallback((value: string): void => {
    dispatch({ type: "setDateTo", value })
  }, [])

  const listSnapshot = useMemo(
    (): OrdersListUrlSnapshot => ({
      search: filters.debouncedSearch,
      activeFilters: filters.activeFilters,
      page: ui.page,
      pageSize: ui.pageSize,
      dateFrom: ui.dateFrom,
      dateTo: ui.dateTo,
      sort: ui.sort,
    }),
    [
      filters.activeFilters,
      filters.debouncedSearch,
      ui.dateFrom,
      ui.dateTo,
      ui.page,
      ui.pageSize,
      ui.sort,
    ],
  )

  const buildOrderDetailPath = useCallback(
    (orderId: string): string => buildOrdersListDetailPath(orderId, listSnapshot),
    [listSnapshot],
  )

  const getRowActions = useCallback(
    (row: OrderListRow): RowActionItem[] => [
      {
        id: "view",
        label: "View",
        onSelect: () => {
          navigate(buildOrderDetailPath(row.id))
        },
      },
    ],
    [navigate, buildOrderDetailPath],
  )

  return {
    filters,
    rows,
    isLoading,
    errorMessage,
    refetch,
    totalFiltered,
    selectedIds,
    selection,
    clearSelection,
    ui,
    setPage,
    setPageSize,
    setDateFrom,
    setDateTo,
    onRequestSort,
    onSortControlChange,
    runBulkFulfillment,
    getRowActions,
    buildOrderDetailPath,
    resetAllFilters,
    clearFilterDates,
    sortControlColumn,
    sortControlDirection,
    resetPage,
  }
}
