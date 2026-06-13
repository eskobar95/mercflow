import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { usePageChrome } from "@/components/layout/pageChrome"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListToolbar } from "@/components/ui/list/ListToolbar"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
import {
  compareSortValues,
  type ListSortState,
} from "@/components/ui/list/types"
import {
  activateAdminDiscount,
  deactivateAdminDiscount,
  listAdminDiscounts,
} from "@/features/discounts/discountsApi"
import {
  DISCOUNT_LIST_COLUMNS,
  type DiscountListSortColumn,
} from "@/features/discounts/discountsListColumns"
import type { AdminDiscountRow } from "@/features/discounts/types"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

function DiscountsBackendMissingNotice(): ReactNode {
  return (
    <div className="border-b border-border-subtle px-6 py-6 text-sm text-content-secondary">
      Configure{" "}
      <code className="rounded-sm bg-surface-subtle px-1 py-0.5 font-mono text-xs">
        VITE_MEDUSA_ADMIN_BACKEND_URL
      </code>{" "}
      so this view can call the MercFlow discount APIs.
    </div>
  )
}

function DiscountsListPageContent(): ReactNode {
  const navigate = useNavigate()
  const [rows, setRows] = useState<AdminDiscountRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [sort, setSort] = useState<ListSortState<DiscountListSortColumn>>({
    column: "name",
    direction: "asc",
  })

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const response = await listAdminDiscounts({ limit: 100 })
      setRows(response.data)
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load discounts")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onRequestSort = useCallback((columnId: DiscountListSortColumn): void => {
    setSort((previous) => {
      if (previous.column !== columnId) {
        return { column: columnId, direction: "asc" }
      }
      if (previous.direction === "asc") {
        return { column: columnId, direction: "desc" }
      }
      return { column: null, direction: "none" }
    })
  }, [])

  const sortedRows = useMemo(() => {
    if (sort.column === null || sort.direction === "none") {
      return rows
    }
    const column = DISCOUNT_LIST_COLUMNS.find((entry) => entry.id === sort.column)
    if (column?.getSortValue === undefined) {
      return rows
    }
    const direction = sort.direction === "asc" ? 1 : -1
    return rows.slice().sort((left, right) => {
      const leftValue = column.getSortValue?.(left)
      const rightValue = column.getSortValue?.(right)
      if (leftValue === undefined || rightValue === undefined) {
        return 0
      }
      return (
        compareSortValues(
          leftValue as string | number | Date,
          rightValue as string | number | Date,
        ) * direction
      )
    })
  }, [rows, sort])

  const updateRow = useCallback((updated: AdminDiscountRow): void => {
    setRows((previous) =>
      previous.map((row) => (row.id === updated.id ? updated : row)),
    )
  }, [])

  const getRowActions = useCallback(
    (row: AdminDiscountRow): RowActionItem[] => {
      const actions: RowActionItem[] = [
        {
          id: "view",
          label: "View details",
          onSelect: () => {
            navigate(`/discounts/${encodeURIComponent(row.id)}`)
          },
        },
      ]

      if (row.status === "active") {
        actions.push({
          id: "deactivate",
          label: "Deactivate",
          onSelect: () => {
            setActionError(null)
            void (async (): Promise<void> => {
              try {
                const updated = await deactivateAdminDiscount(row.id)
                updateRow(updated)
              } catch (error: unknown) {
                setActionError(
                  error instanceof Error ? error.message : "Failed to deactivate discount",
                )
              }
            })()
          },
        })
      } else if (row.status !== "expired") {
        actions.push({
          id: "activate",
          label: "Activate",
          onSelect: () => {
            setActionError(null)
            void (async (): Promise<void> => {
              try {
                const updated = await activateAdminDiscount(row.id)
                updateRow(updated)
              } catch (error: unknown) {
                setActionError(
                  error instanceof Error ? error.message : "Failed to activate discount",
                )
              }
            })()
          },
        })
      }

      return actions
    },
    [navigate, updateRow],
  )

  const pageChrome = useMemo(
    () => ({
      titleBadge: (
        <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-xs font-semibold tabular-nums text-content-secondary">
          {isLoading ? "…" : sortedRows.length}
        </span>
      ),
      actions: (
        <Link
          to="/discounts/new"
          className="inline-flex h-8 items-center rounded-sm bg-interactive-primary px-3 text-xs font-medium text-content-inverse transition-colors hover:bg-interactive-primary-hover"
        >
          Create discount
        </Link>
      ),
    }),
    [isLoading, sortedRows.length],
  )

  usePageChrome(pageChrome)

  const showEmpty = !isLoading && errorMessage === null && sortedRows.length === 0

  return (
    <div className="flex min-h-full flex-col bg-surface-appCard">
      <ListToolbar
        title="Discounts"
        description="Manage product, order, shipping, and bundle promotions for your store."
        end={
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-sm border border-border-default bg-surface-appCard px-3 text-xs font-medium text-content-secondary transition-colors hover:border-border-strong hover:text-content-primary disabled:opacity-50"
            disabled={isLoading}
            onClick={() => {
              void load()
            }}
          >
            Refresh
          </button>
        }
      />

      {errorMessage !== null ? (
        <div className="border-b border-border-subtle px-4 py-4 text-sm text-feedback-danger-content">
          {errorMessage}
        </div>
      ) : null}

      {actionError !== null ? (
        <div className="border-b border-border-subtle px-4 py-3 text-sm text-feedback-danger-content">
          {actionError}
        </div>
      ) : null}

      {showEmpty ? (
        <div className="p-10">
          <ListEmptyState
            title="No discounts yet"
            description="Create your first discount to run promotions on products, orders, or shipping."
            action={
              <Link
                to="/discounts/new"
                className="inline-flex h-8 items-center rounded-sm bg-interactive-primary px-3 text-xs font-medium text-content-inverse transition-colors hover:bg-interactive-primary-hover"
              >
                Create discount
              </Link>
            }
          />
        </div>
      ) : (
        <DataTable
          aria-label="Discounts"
          columns={DISCOUNT_LIST_COLUMNS}
          data={sortedRows}
          getRowId={(row) => row.id}
          sortState={sort}
          onRequestSort={onRequestSort}
          getRowActions={getRowActions}
          hasRowActions
          isLoading={isLoading && errorMessage === null}
          fillHeight
          onRowClick={(row) => {
            navigate(`/discounts/${encodeURIComponent(row.id)}`)
          }}
          emptyState={
            <ListEmptyState
              bare
              title="No discounts yet"
              description="Create your first discount to run promotions on products, orders, or shipping."
            />
          }
        />
      )}
    </div>
  )
}

export function DiscountsListPage(): ReactNode {
  if (resolveMedusaAdminBackendUrl() === null) {
    return <DiscountsBackendMissingNotice />
  }

  return <DiscountsListPageContent />
}
