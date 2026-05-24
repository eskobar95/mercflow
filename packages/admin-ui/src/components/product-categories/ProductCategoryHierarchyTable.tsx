import type { JSX, ReactNode } from "react"
import { Link } from "react-router-dom"

import { RowActionsMenu, type RowActionItem } from "@/components/ui/list/RowActionsMenu"
import { TableSkeleton } from "@/components/ui/list/TableSkeleton"
import type { AdminProductCategoryHierarchyRow } from "@/features/product-categories/types"

function nameIndentClass(depth: number): string {
  const tiers = ["pl-4", "pl-10", "pl-16", "pl-24", "pl-32", "pl-40"]
  return tiers[Math.min(depth, tiers.length - 1)] ?? "pl-40"
}

const headerCell =
  "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-content-tertiary"
const dataCell = "px-4 py-3 text-sm text-content-primary align-middle"

export type ProductCategoryHierarchyTableProps = {
  rows: AdminProductCategoryHierarchyRow[]
  isLoading?: boolean
  emptyState?: ReactNode
  getRowActions?: (row: AdminProductCategoryHierarchyRow) => RowActionItem[] | null
}

export function ProductCategoryHierarchyTable({
  rows,
  isLoading = false,
  emptyState,
  getRowActions,
}: ProductCategoryHierarchyTableProps): JSX.Element {
  const hasActionsColumn = typeof getRowActions === "function"
  const coreColumns = 5
  const colCount = coreColumns + (hasActionsColumn ? 1 : 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Product categories in parent-child order from Medusa
        </caption>
        <thead className="border-b border-border-subtle bg-surface-subtle">
          <tr>
            <th scope="col" className={headerCell}>
              Name
            </th>
            <th scope="col" className={headerCell}>
              Handle
            </th>
            <th scope="col" className={headerCell}>
              Products
            </th>
            <th scope="col" className={headerCell}>
              Status
            </th>
            <th scope="col" className={headerCell}>
              Last updated
            </th>
            {hasActionsColumn ? (
              <th scope="col" className={`${headerCell} w-px text-right`}>
                <span className="sr-only">Row actions</span>
              </th>
            ) : null}
          </tr>
        </thead>
        {isLoading ? (
          <TableSkeleton
            columnCount={coreColumns}
            rowCount={6}
            showSelectColumn={false}
            showActionsColumn={hasActionsColumn}
          />
        ) : rows.length === 0 ? (
          <tbody className="border-b border-border-subtle bg-surface-default">
            <tr>
              <td colSpan={colCount}>{emptyState ?? null}</td>
            </tr>
          </tbody>
        ) : (
          <tbody className="divide-y divide-border-subtle bg-surface-default">
            {rows.map((row) => {
              const actions = getRowActions?.(row) ?? []
              const hasMenu = actions.length > 0
              return (
                <tr key={row.id} className="hover:bg-surface-subtle">
                  <td className={`${dataCell} ${nameIndentClass(row.depth)}`}>
                    <Link
                      to={`/product-categories/${encodeURIComponent(row.id)}`}
                      className="font-medium text-interactive-primary hover:text-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className={`${dataCell} font-mono text-xs text-content-tertiary`}>
                    {row.handle}
                  </td>
                  <td className={`${dataCell} text-content-secondary`}>
                    {String(row.productCount)}
                  </td>
                  <td className={dataCell}>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                        row.is_active
                          ? "border-border-subtle bg-surface-subtle text-content-secondary"
                          : "border-border-default bg-surface-raised text-content-tertiary"
                      }`}
                    >
                      {row.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className={`${dataCell} text-content-secondary`}>
                    <time dateTime={row.updated_at}>
                      {new Date(row.updated_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </td>
                  {hasActionsColumn ? (
                    <td className={`${dataCell} text-right`}>
                      {hasMenu ? (
                        <RowActionsMenu
                          items={actions}
                          aria-label={`Row actions for ${row.name}`}
                        />
                      ) : (
                        <span className="text-content-tertiary">—</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        )}
      </table>
    </div>
  )
}
