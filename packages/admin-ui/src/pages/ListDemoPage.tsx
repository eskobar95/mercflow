import { type ReactNode, useCallback, useMemo, useReducer } from "react"
import { Link } from "react-router-dom"

import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import { ListToolbar } from "@/components/ui/list/ListToolbar"
import { type RowActionItem } from "@/components/ui/list/RowActionsMenu"
import {
  type ListColumnDef,
  type ListSortState,
  compareSortValues,
} from "@/components/ui/list/types"

type DemoRow = {
  id: string
  name: string
  status: "draft" | "published" | "archived"
  updatedAt: string
}

type DemoCol = "name" | "status" | "updatedAt"

const MOCK: DemoRow[] = [
  {
    id: "1",
    name: "Aurora running shoes",
    status: "published",
    updatedAt: "2026-01-20T10:00:00.000Z",
  },
  {
    id: "2",
    name: "Canvas tote (medium)",
    status: "draft",
    updatedAt: "2026-02-14T12:15:00.000Z",
  },
  {
    id: "3",
    name: "Merino beanie",
    status: "published",
    updatedAt: "2025-12-01T08:00:00.000Z",
  },
  {
    id: "4",
    name: "Recycled cap",
    status: "archived",
    updatedAt: "2025-11-10T16:20:00.000Z",
  },
  {
    id: "5",
    name: "Trail backpack 28L",
    status: "draft",
    updatedAt: "2026-03-01T09:00:00.000Z",
  },
  {
    id: "6",
    name: "Linen table runner",
    status: "published",
    updatedAt: "2026-01-30T11:00:00.000Z",
  },
  {
    id: "7",
    name: "Glass water bottle 750ml",
    status: "draft",
    updatedAt: "2026-02-28T14:00:00.000Z",
  },
  {
    id: "8",
    name: "Ceramic pour-over set",
    status: "published",
    updatedAt: "2026-02-10T10:00:00.000Z",
  },
  {
    id: "9",
    name: "Travel pouch set",
    status: "draft",
    updatedAt: "2026-03-15T10:00:00.000Z",
  },
  {
    id: "10",
    name: "Kids rain jacket",
    status: "published",
    updatedAt: "2026-02-20T10:00:00.000Z",
  },
  {
    id: "11",
    name: "Cotton t-shirt (unisex)",
    status: "draft",
    updatedAt: "2026-02-12T10:00:00.000Z",
  },
  {
    id: "12",
    name: "Leather card holder",
    status: "published",
    updatedAt: "2026-01-05T10:00:00.000Z",
  },
  {
    id: "13",
    name: "Sunglasses polarized",
    status: "archived",
    updatedAt: "2025-10-20T10:00:00.000Z",
  },
  {
    id: "14",
    name: "Yoga mat 5mm",
    status: "draft",
    updatedAt: "2026-03-18T10:00:00.000Z",
  },
  {
    id: "15",
    name: "Insulated meal jar",
    status: "published",
    updatedAt: "2026-02-22T10:00:00.000Z",
  },
]

const COLUMNS: ListColumnDef<DemoRow, DemoCol>[] = [
  {
    id: "name",
    header: "Name",
    sortable: true,
    getSortValue: (r) => r.name,
    cellClassName: "font-medium",
    renderCell: (r) => r.name,
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    getSortValue: (r) => r.status,
    renderCell: (r) => (
      <span className="inline-flex items-center rounded-md border border-border-subtle bg-surface-subtle px-2 py-0.5 text-xs font-medium capitalize text-content-secondary">
        {r.status}
      </span>
    ),
  },
  {
    id: "updatedAt",
    header: "Last updated",
    sortable: true,
    getSortValue: (r) => new Date(r.updatedAt).getTime(),
    renderCell: (r) => (
      <time dateTime={r.updatedAt} className="text-content-secondary">
        {new Date(r.updatedAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </time>
    ),
  },
]

const DEMO_ROW_ACTIONS: RowActionItem[] = [
  {
    id: "view",
    label: "View (mock)",
    onSelect: () => { /* demo stub */ },
  },
  {
    id: "edit",
    label: "Edit (mock)",
    onSelect: () => { /* demo stub */ },
  },
  {
    id: "delete",
    label: "Remove from demo",
    destructive: true,
    onSelect: () => { /* demo stub */ },
  },
]

const getDemoRowActions: (row: DemoRow) => RowActionItem[] = () => DEMO_ROW_ACTIONS

type ListDemoUiState = {
  search: string
  page: number
  pageSize: number
  selectedIds: Set<string>
  isLoading: boolean
  sort: ListSortState<DemoCol>
}

type ListDemoUiAction =
  | { type: "setSearch"; value: string }
  | { type: "setPage"; page: number }
  | { type: "setPageSize"; pageSize: number }
  | { type: "toggleLoading" }
  | { type: "cycleSort"; columnId: DemoCol }
  | { type: "selectAll"; pageIds: string[]; select: boolean }
  | { type: "selectRow"; id: string; select: boolean }

const INITIAL_LIST_DEMO_UI_STATE: ListDemoUiState = {
  search: "",
  page: 1,
  pageSize: 10,
  selectedIds: new Set(),
  isLoading: false,
  sort: { column: "updatedAt", direction: "desc" },
}

function listDemoUiReducer(state: ListDemoUiState, action: ListDemoUiAction): ListDemoUiState {
  switch (action.type) {
    case "setSearch":
      return { ...state, search: action.value, page: 1 }
    case "setPage":
      return { ...state, page: action.page }
    case "setPageSize":
      return { ...state, pageSize: action.pageSize, page: 1 }
    case "toggleLoading":
      return { ...state, isLoading: !state.isLoading }
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
    case "selectAll": {
      const next = new Set(state.selectedIds)
      if (action.select) {
        for (const id of action.pageIds) {
          next.add(id)
        }
      } else {
        for (const id of action.pageIds) {
          next.delete(id)
        }
      }
      return { ...state, selectedIds: next }
    }
    case "selectRow": {
      const next = new Set(state.selectedIds)
      if (action.select) {
        next.add(action.id)
      } else {
        next.delete(action.id)
      }
      return { ...state, selectedIds: next }
    }
    default:
      return state
  }
}

/**
 * In-package list primitive demo. Mock rows only; no real API.
 */
export function ListDemoPage(): ReactNode {
  const [ui, dispatch] = useReducer(listDemoUiReducer, INITIAL_LIST_DEMO_UI_STATE)
  const { search, page, pageSize, selectedIds, isLoading, sort } = ui

  const onRequestSort = useCallback((columnId: DemoCol): void => {
    dispatch({ type: "cycleSort", columnId })
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) {
      return MOCK
    }
    return MOCK.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.status.toLowerCase().includes(q)
    )
  }, [search])

  const sorted = useMemo(() => {
    if (!sort.column || sort.direction === "none") {
      return filtered
    }
    const def = COLUMNS.find((c) => c.id === sort.column)
    if (!def?.getSortValue) {
      return filtered
    }
    const dir = sort.direction === "asc" ? 1 : -1
    const withSort = filtered.toSorted((a, b) => {
      const av = def.getSortValue?.(a)
      const bv = def.getSortValue?.(b)
      if (av === undefined || bv === undefined) {
        return 0
      }
      return compareSortValues(
        av as string | number | Date,
        bv as string | number | Date
      ) * dir
    })
    return withSort
  }, [filtered, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, pageCount)

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, currentPage, pageSize])

  const pageIds = useMemo(() => paged.map((r) => r.id), [paged])

  const onSelectAll = (select: boolean): void => {
    dispatch({ type: "selectAll", pageIds, select })
  }

  const onSelectRow = (id: string, select: boolean): void => {
    dispatch({ type: "selectRow", id, select })
  }

  const getRowActions = getDemoRowActions

  return (
    <div className="p-6">
        <div className="overflow-hidden rounded-lg border border-border-default bg-surface-default shadow-sm">
      <ListToolbar
        title="List primitives demo"
        description="Mock products for reviewing table, filters, sort, selection, and pagination. No network calls."
        end={
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
            >
              Home
            </Link>
            <button
              type="button"
              className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              onClick={() => {
                dispatch({ type: "toggleLoading" })
              }}
            >
              Toggle loading (demo)
            </button>
          </div>
        }
      >
        <label className="flex min-w-0 max-w-sm flex-1 items-center gap-2">
          <span className="shrink-0 text-sm text-content-secondary">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              dispatch({ type: "setSearch", value: e.target.value })
            }}
            placeholder="Name or status"
            className="min-w-0 flex-1 rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus"
            aria-label="Filter mock rows by name or status"
          />
        </label>
      </ListToolbar>
        <DataTable<DemoRow, DemoCol>
          aria-label="Mock product list"
          caption="Mock data for list primitive review"
          columns={COLUMNS}
          data={paged}
          getRowId={(r) => r.id}
          sortState={sort}
          onRequestSort={onRequestSort}
          selection={{
            selectedIds,
            onSelectAll,
            onSelectRow,
          }}
          getRowActions={getRowActions}
          isLoading={isLoading}
          emptyState={
            <ListEmptyState
              title="No rows to show"
              description="Try a different search or clear the filter."
            />
          }
        />
        <ListPagination
          aria-label="Mock table pagination"
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={sorted.length}
          onPageChange={(p) => {
            dispatch({ type: "setPage", page: p })
          }}
          onPageSizeChange={(s) => {
            dispatch({ type: "setPageSize", pageSize: s })
          }}
        />
        </div>
      </div>
  )
}
