import { type ReactNode, useCallback, useEffect, useReducer, type FormEvent } from "react"

import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import type { ListColumnDef, ListSortState } from "@/components/ui/list/types"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
import { settingsSeoBreadcrumbs } from "@/config/settingsBreadcrumbs"
import {
  createAdminRedirect,
  deleteAdminRedirect,
  listAdminRedirects,
} from "@/features/seo/redirectsApi"
import type { RedirectDto } from "@/features/seo/types"

type RedirectCol = "from_path" | "to_path" | "type" | "chain"

const REDIRECT_COLUMNS: ListColumnDef<RedirectDto, RedirectCol>[] = [
  {
    id: "from_path",
    header: "Source",
    renderCell: (row) => row.from_path,
    getSortValue: (row) => row.from_path,
    sortable: true,
  },
  {
    id: "to_path",
    header: "Destination",
    renderCell: (row) => row.to_path,
    getSortValue: (row) => row.to_path,
    sortable: true,
  },
  {
    id: "type",
    header: "Type",
    renderCell: (row) => row.type,
    getSortValue: (row) => row.type,
    sortable: true,
  },
  {
    id: "chain",
    header: "Chain",
    renderCell: (row) =>
      row.has_chain_warning ? (
        <span className="font-medium text-content-danger">Chain warning</span>
      ) : (
        "—"
      ),
  },
]

type RedirectsListState = {
  rows: RedirectDto[]
  phase: "loading" | "ready" | "error"
  message: string | null
  fromPath: string
  toPath: string
  creating: boolean
  sort: ListSortState<RedirectCol>
}

type RedirectsListAction =
  | { type: "reloadStart" }
  | { type: "reloadSuccess"; rows: RedirectDto[] }
  | { type: "reloadError"; message: string }
  | { type: "setMessage"; message: string | null }
  | { type: "setFromPath"; value: string }
  | { type: "setToPath"; value: string }
  | { type: "createStart" }
  | { type: "createFinish" }
  | { type: "clearCreateForm" }
  | { type: "cycleSort"; columnId: RedirectCol }

const INITIAL_REDIRECTS_LIST_STATE: RedirectsListState = {
  rows: [],
  phase: "loading",
  message: null,
  fromPath: "",
  toPath: "",
  creating: false,
  sort: { column: "from_path", direction: "asc" },
}

function redirectsListReducer(
  state: RedirectsListState,
  action: RedirectsListAction,
): RedirectsListState {
  switch (action.type) {
    case "reloadStart":
      return { ...state, phase: "loading", message: null }
    case "reloadSuccess":
      return { ...state, rows: action.rows, phase: "ready" }
    case "reloadError":
      return { ...state, phase: "error", message: action.message }
    case "setMessage":
      return { ...state, message: action.message }
    case "setFromPath":
      return { ...state, fromPath: action.value }
    case "setToPath":
      return { ...state, toPath: action.value }
    case "createStart":
      return { ...state, creating: true, message: null }
    case "createFinish":
      return { ...state, creating: false }
    case "clearCreateForm":
      return { ...state, fromPath: "", toPath: "" }
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

export function RedirectsListPage(): ReactNode {
  const [state, dispatch] = useReducer(redirectsListReducer, INITIAL_REDIRECTS_LIST_STATE)
  const { rows, phase, message, fromPath, toPath, creating, sort } = state

  const reload = useCallback(async (): Promise<void> => {
    dispatch({ type: "reloadStart" })
    try {
      const list = await listAdminRedirects()
      dispatch({ type: "reloadSuccess", rows: list })
    } catch (err: unknown) {
      dispatch({
        type: "reloadError",
        message: err instanceof Error ? err.message : "Failed to load redirects",
      })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const onRequestSort = (columnId: RedirectCol): void => {
    dispatch({ type: "cycleSort", columnId })
  }

  const sortedRows = rows.toSorted((a, b) => {
    const col = sort.column
    if (col === null || sort.direction === "none") {
      return 0
    }
    const def = REDIRECT_COLUMNS.find((c) => c.id === col)
    const av = def?.getSortValue?.(a) ?? ""
    const bv = def?.getSortValue?.(b) ?? ""
    const cmp = String(av).localeCompare(String(bv))
    return sort.direction === "asc" ? cmp : -cmp
  })

  const getRowActions = (row: RedirectDto): RowActionItem[] => [
    {
      id: "delete",
      label: "Delete",
      destructive: true,
      onSelect: () => {
        void (async (): Promise<void> => {
          try {
            await deleteAdminRedirect(row.id)
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
  ]

  const handleCreate = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    dispatch({ type: "createStart" })
    try {
      await createAdminRedirect({ from_path: fromPath, to_path: toPath })
      dispatch({ type: "clearCreateForm" })
      await reload()
    } catch (err: unknown) {
      dispatch({
        type: "setMessage",
        message: err instanceof Error ? err.message : "Create failed",
      })
    } finally {
      dispatch({ type: "createFinish" })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO — Redirects"
        description="301 redirects for your storefront. Auto redirects are created when product or category handles change."
        breadcrumbs={settingsSeoBreadcrumbs("Redirects")}
      />

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-content-primary">Create manual redirect</h2>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => void handleCreate(e)}>
          <FormField label="Source path" required>
            <Input
              value={fromPath}
              placeholder="/old-product"
              disabled={creating}
              onChange={(e) => dispatch({ type: "setFromPath", value: e.target.value })}
            />
          </FormField>
          <FormField label="Destination path" required>
            <Input
              value={toPath}
              placeholder="/new-product"
              disabled={creating}
              onChange={(e) => dispatch({ type: "setToPath", value: e.target.value })}
            />
          </FormField>
          <div className="md:col-span-2">
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? "Creating…" : "Add redirect"}
            </Button>
          </div>
        </form>
        {message !== null && phase === "ready" ? (
          <p role="alert" className="text-sm text-content-danger">
            {message}
          </p>
        ) : null}
      </Card>

      {phase === "error" ? (
        <div role="alert" className="text-sm text-content-danger">
          {message}
          <Button type="button" variant="secondary" className="mt-4" onClick={() => void reload()}>
            Retry
          </Button>
        </div>
      ) : (
        <DataTable<RedirectDto, RedirectCol>
          aria-label="Redirects"
          caption="301 redirects"
          columns={REDIRECT_COLUMNS}
          data={sortedRows}
          getRowId={(row) => row.id}
          sortState={sort}
          onRequestSort={onRequestSort}
          getRowActions={getRowActions}
          isLoading={phase === "loading"}
          emptyState={
            <ListEmptyState
              title="No redirects"
              description="Manual redirects appear here. Auto redirects are created when handles change."
            />
          }
        />
      )}
    </div>
  )
}
