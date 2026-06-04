import { useCallback, useEffect, useState, type FormEvent } from "react"

import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import type { ListColumnDef, ListSortState } from "@/components/ui/list/types"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
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

export function RedirectsListPage(): JSX.Element {
  const [rows, setRows] = useState<RedirectDto[]>([])
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading")
  const [message, setMessage] = useState<string | null>(null)
  const [fromPath, setFromPath] = useState("")
  const [toPath, setToPath] = useState("")
  const [creating, setCreating] = useState(false)
  const [sort, setSort] = useState<ListSortState<RedirectCol>>({
    column: "from_path",
    direction: "asc",
  })

  const reload = useCallback(async (): Promise<void> => {
    setPhase("loading")
    setMessage(null)
    try {
      const list = await listAdminRedirects()
      setRows(list)
      setPhase("ready")
    } catch (err: unknown) {
      setPhase("error")
      setMessage(err instanceof Error ? err.message : "Failed to load redirects")
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const onRequestSort = (columnId: RedirectCol): void => {
    setSort((prev) => {
      if (prev.column !== columnId) {
        return { column: columnId, direction: "asc" }
      }
      if (prev.direction === "asc") {
        return { column: columnId, direction: "desc" }
      }
      return { column: null, direction: "none" }
    })
  }

  const sortedRows = [...rows].sort((a, b) => {
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
            setMessage(err instanceof Error ? err.message : "Delete failed")
          }
        })()
      },
    },
  ]

  const handleCreate = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setCreating(true)
    setMessage(null)
    try {
      await createAdminRedirect({ from_path: fromPath, to_path: toPath })
      setFromPath("")
      setToPath("")
      await reload()
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Create failed")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO — Redirects"
        description="301 redirects for your storefront. Auto redirects are created when product or category handles change."
      />

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-content-primary">Create manual redirect</h2>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => void handleCreate(e)}>
          <FormField label="Source path" required>
            <Input
              value={fromPath}
              placeholder="/old-product"
              disabled={creating}
              onChange={(e) => setFromPath(e.target.value)}
            />
          </FormField>
          <FormField label="Destination path" required>
            <Input
              value={toPath}
              placeholder="/new-product"
              disabled={creating}
              onChange={(e) => setToPath(e.target.value)}
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
