import { useMemo, useState } from "react"

import { Link } from "react-router-dom"

import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { SubscriptionStatusBadge } from "@/components/subscriptions/SubscriptionStatusBadge"
import type { AdminSubscriptionRow } from "@/features/subscriptions"
import {
  type ListColumnDef,
  type ListSortState,
  compareSortValues,
} from "@/components/ui/list/types"

type SubCol =
  | "customer"
  | "product"
  | "status"
  | "cycle"
  | "renewal"
  | "discount"

const SUB_COLUMNS: ListColumnDef<AdminSubscriptionRow, SubCol>[] = [
  {
    id: "customer",
    header: "Customer",
    sortable: true,
    getSortValue: (r) => r.customer_display ?? "",
    cellClassName: "font-medium",
    renderCell: (r) => (
      <Link
        to={`/customers/${encodeURIComponent(r.customer_id)}`}
        className="text-interactive-primary hover:text-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
      >
        {r.customer_display ?? r.customer_id}
      </Link>
    ),
  },
  {
    id: "product",
    header: "Product / variant",
    sortable: true,
    getSortValue: (r) => r.product_label ?? "",
    renderCell: (r) => r.product_label ?? r.variant_id,
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    getSortValue: (r) => r.status,
    renderCell: (r) => <SubscriptionStatusBadge status={r.status} />,
  },
  {
    id: "cycle",
    header: "Cycle (weeks)",
    sortable: true,
    getSortValue: (r) => r.cycle_weeks,
    renderCell: (r) => r.cycle_weeks,
  },
  {
    id: "renewal",
    header: "Next renewal",
    sortable: true,
    getSortValue: (r) => {
      const d = r.next_renewal_at
      if (d == null) {
        return 0
      }
      return new Date(d).getTime()
    },
    renderCell: (r) => {
      if (r.next_renewal_at == null) {
        return <span className="text-content-tertiary">—</span>
      }
      return (
        <time dateTime={r.next_renewal_at} className="text-content-secondary">
          {new Date(r.next_renewal_at).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      )
    },
  },
  {
    id: "discount",
    header: "Discount",
    sortable: true,
    getSortValue: (r) => r.discount_percent ?? -1,
    renderCell: (r) =>
      r.discount_percent == null ? (
        <span className="text-content-tertiary">—</span>
      ) : (
        <span className="text-content-secondary">{`${r.discount_percent}%`}</span>
      ),
  },
]

export type SubscriptionsTableProps = {
  rows: readonly AdminSubscriptionRow[]
  isLoading?: boolean
}

/**
 * Sortable subscriptions grid with preset-backed badges (MercFlow `/subscriptions`).
 */
export function SubscriptionsTable({ rows, isLoading = false }: SubscriptionsTableProps): JSX.Element {
  const allRows = useMemo(() => [...rows], [rows])

  const [sort, setSort] = useState<ListSortState<SubCol>>({
    column: "renewal",
    direction: "asc",
  })

  const onRequestSort = (columnId: SubCol): void => {
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

  const sortedRows = useMemo(() => {
    if (sort.column === null || sort.direction === "none") {
      return allRows
    }
    const def = SUB_COLUMNS.find((c) => c.id === sort.column)
    if (def?.getSortValue === undefined) {
      return allRows
    }
    const dir = sort.direction === "asc" ? 1 : -1
    return [...allRows].sort((a, b) => {
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
  }, [allRows, sort])

  return (
    <DataTable<AdminSubscriptionRow, SubCol>
      aria-label="Subscriptions"
      columns={SUB_COLUMNS}
      data={sortedRows}
      getRowId={(r) => r.id}
      sortState={sort}
      onRequestSort={onRequestSort}
      hasRowActions={false}
      isLoading={isLoading}
      skeletonRowCount={8}
      emptyState={
        <ListEmptyState
          title="No subscriptions"
          description="When customers subscribe via the storefront, their subscription rows appear here."
        />
      }
    />
  )
}
