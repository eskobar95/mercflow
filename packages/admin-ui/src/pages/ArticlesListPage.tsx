import type { JSX } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

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
  DEFAULT_ARTICLE_LOCALE,
  listArticlesAdmin,
} from "@/features/articles/articlesApi"
import type { ArticleAdminRecord } from "@/features/articles/types"

import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type ArticleCol = "title" | "status" | "published_at" | "locale"

const COLUMNS: ListColumnDef<ArticleAdminRecord, ArticleCol>[] = [
  {
    id: "title",
    header: "Title",
    sortable: true,
    getSortValue: (row) => row.title.toLocaleLowerCase(),
    cellClassName: "font-medium",
    renderCell: (row) => (
      <Link
        to={`/content/articles/${encodeURIComponent(row.id)}`}
        className="text-text-link hover:underline"
      >
        {row.title}
      </Link>
    ),
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    getSortValue: (row) => row.status,
    renderCell: (row) => <span className="capitalize">{row.status}</span>,
  },
  {
    id: "published_at",
    header: "Published",
    sortable: true,
    getSortValue: (row) => (row.published_at ? new Date(row.published_at).getTime() : 0),
    renderCell: (row) =>
      row.published_at ? (
        <time dateTime={row.published_at}>
          {new Date(row.published_at).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      ) : (
        <span className="text-text-secondary">—</span>
      ),
  },
  {
    id: "locale",
    header: "Locale",
    sortable: true,
    getSortValue: (row) => row.locale,
    renderCell: (row) => row.locale,
  },
]

export function ArticlesListPage(): JSX.Element {
  const navigate = useNavigate()
  const hasBackendConfiguration = resolveMedusaAdminBackendUrl() !== null

  const [rows, setRows] = useState<ArticleAdminRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [sort, setSort] = useState<ListSortState<ArticleCol>>({
    column: "title",
    direction: "asc",
  })

  const load = useCallback(async (): Promise<void> => {
    if (!hasBackendConfiguration) {
      return
    }
    setIsLoading(true)
    setListError(null)
    try {
      const next = await listArticlesAdmin(DEFAULT_ARTICLE_LOCALE)
      setRows(next)
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load articles")
    } finally {
      setIsLoading(false)
    }
  }, [hasBackendConfiguration])

  useEffect(() => {
    void load()
  }, [load])

  const onRequestSort = useCallback((columnId: ArticleCol) => {
    setSort((s) => {
      if (s.column !== columnId) {
        return { column: columnId, direction: "asc" }
      }
      if (s.direction === "asc") {
        return { column: columnId, direction: "desc" }
      }
      if (s.direction === "desc") {
        return { column: null, direction: "none" }
      }
      return { column: columnId, direction: "asc" }
    })
  }, [])

  const sortedRows = useMemo(() => {
    if (!sort.column || sort.direction === "none") {
      return rows
    }
    const def = COLUMNS.find((c) => c.id === sort.column)
    if (!def?.getSortValue) {
      return rows
    }
    const dir = sort.direction === "asc" ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = def.getSortValue?.(a)
      const bv = def.getSortValue?.(b)
      if (av === undefined || bv === undefined) {
        return 0
      }
      return (
        compareSortValues(av as string | number | Date, bv as string | number | Date) * dir
      )
    })
  }, [rows, sort])

  const getRowActions = useCallback(
    (row: ArticleAdminRecord): RowActionItem[] => {
      return [
        {
          id: "edit",
          label: "Edit article",
          onSelect: () => {
            navigate(`/content/articles/${encodeURIComponent(row.id)}`)
          },
        },
      ]
    },
    [navigate]
  )

  if (!hasBackendConfiguration) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-secondary">
          Backend URL missing. Configure{" "}
          <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code>{" "}
          so MercFlow can load articles from Medusa Admin.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      <ListToolbar
        title="Articles"
        primaryAction={
          <Button
            type="button"
            onClick={() => {
              navigate("/content/articles/new")
            }}
          >
            New article
          </Button>
        }
      />

      {listError ? <p className="text-sm text-status-error">{listError}</p> : null}

      <DataTable
        aria-label="Articles"
        caption="MercFlow CMS articles"
        columns={COLUMNS}
        data={sortedRows}
        getRowId={(row) => row.id}
        sortState={sort}
        onRequestSort={onRequestSort}
        getRowActions={getRowActions}
        isLoading={isLoading}
        emptyState={
          <ListEmptyState
            title="No articles yet"
            description="Create your first blog post for the storefront."
            action={
              <Button
                type="button"
                onClick={() => {
                  navigate("/content/articles/new")
                }}
              >
                Create article
              </Button>
            }
          />
        }
      />
    </div>
  )
}
