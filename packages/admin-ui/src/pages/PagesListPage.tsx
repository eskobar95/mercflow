import type { JSX } from "react"
import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListToolbar } from "@/components/ui/list/ListToolbar"
import { RowActionsMenu, type RowActionItem } from "@/components/ui/list/RowActionsMenu"
import {
  fetchCmsPagesList,
  type CmsPageAdminRow,
} from "@/features/cms-pages/cmsPagesAdminApi"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "config_error"; message: string }
  | { status: "error"; message: string }
  | { status: "success"; rows: CmsPageAdminRow[] }

function formatUpdatedAt(value: string | undefined): string {
  if (!value) {
    return "—"
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    return "—"
  }
  return d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
}

export function PagesListPage(): JSX.Element {
  const navigate = useNavigate()
  const [state, setState] = useState<LoadState>({ status: "idle" })

  const reload = useCallback((): void => {
    const base = resolveMedusaAdminBackendUrl()
    if (base === null) {
      setState({
        status: "config_error",
        message:
          "Set VITE_MEDUSA_ADMIN_BACKEND_URL to your Medusa origin (e.g. http://localhost:9000).",
      })
      return
    }

    setState({ status: "loading" })
    void (async (): Promise<void> => {
      try {
        const { pages } = await fetchCmsPagesList({ locale: "en", limit: 100, offset: 0 })
        setState({ status: "success", rows: pages })
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unable to load pages."
        setState({ status: "error", message })
      }
    })()
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const getRowActions = useCallback(
    (row: CmsPageAdminRow): RowActionItem[] => [
      {
        id: "open",
        label: "Edit",
        onSelect: (): void => {
          navigate(`/content/pages/${encodeURIComponent(row.id)}`)
        },
      },
    ],
    [navigate]
  )

  let notice: JSX.Element | null = null
  if (state.status === "config_error" || state.status === "error") {
    notice = (
      <div
        role="alert"
        className="mb-4 rounded-md border border-border-default bg-surface-raised p-4 text-sm text-content-secondary"
      >
        <p className="font-medium text-content-primary">
          {state.status === "config_error" ? "Admin backend not configured" : "Unable to load pages"}
        </p>
        <p className="mt-2">{state.message}</p>
        <button
          type="button"
          className="mt-3 rounded-md bg-interactive-primary px-3 py-1.5 text-sm font-medium text-content-inverse transition hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          onClick={() => {
            reload()
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  const showSkeleton = state.status === "idle" || state.status === "loading"
  const showEmpty =
    state.status === "success" && state.rows.length === 0 && !showSkeleton && !notice

  return (
    <div className="p-6">
      {notice}
      <div className="overflow-hidden rounded-lg border border-border-default bg-surface-default shadow-sm">
        <ListToolbar
          title="Pages"
          description="Storefront pages with title, slug, and publish state. Block editing arrives in a later release."
          end={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/content/pages/new"
                className="rounded-md bg-interactive-primary px-3 py-1.5 text-sm font-medium text-content-inverse transition hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              >
                New page
              </Link>
              <button
                type="button"
                className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
                onClick={() => {
                  reload()
                }}
                disabled={showSkeleton || state.status === "config_error"}
              >
                Refresh
              </button>
            </div>
          }
        />
        {showEmpty ? (
          <div className="p-10">
            <ListEmptyState
              title="No pages yet"
              description="Create a page to build landing or content URLs for your storefront."
              action={
                <Link
                  to="/content/pages/new"
                  className="rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                >
                  Create page
                </Link>
              }
            />
          </div>
        ) : null}
        {!showEmpty && !notice ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-subtle text-left text-sm">
              <thead className="bg-surface-subtle text-content-secondary">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Title
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Slug
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Updated
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-surface-default text-content-primary">
                {showSkeleton
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={`sk-${String(i)}`}>
                        <td className="px-4 py-3" colSpan={6}>
                          <div className="h-4 w-48 max-w-full animate-pulse rounded bg-surface-subtle" />
                        </td>
                      </tr>
                    ))
                  : state.status === "success"
                    ? state.rows.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3 font-medium">
                            <Link
                              to={`/content/pages/${encodeURIComponent(row.id)}`}
                              className="text-interactive-primary hover:text-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                            >
                              {row.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-content-secondary">{row.slug}</td>
                          <td className="px-4 py-3 capitalize text-content-secondary">{row.page_type}</td>
                          <td className="px-4 py-3 capitalize text-content-secondary">{row.status}</td>
                          <td className="px-4 py-3 text-content-secondary">
                            {formatUpdatedAt(row.updated_at)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <RowActionsMenu
                              aria-label={`Actions for page ${row.title}`}
                              items={getRowActions(row)}
                            />
                          </td>
                        </tr>
                      ))
                    : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  )
}
