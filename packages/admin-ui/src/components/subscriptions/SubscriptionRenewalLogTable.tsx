import { Link } from "react-router-dom"
import type { ReactNode } from "react"

import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import type { ListColumnDef } from "@/components/ui/list/types"
import type { AdminRenewalLogRow } from "@/features/subscriptions/types"

type RenewalLogColumn = "date" | "amount" | "status" | "order"

const RENEWAL_LOG_COLUMNS: ListColumnDef<AdminRenewalLogRow, RenewalLogColumn>[] = [
  {
    id: "date",
    header: "Date",
    renderCell: (row) => (
      <time dateTime={row.created_at} className="text-content-secondary">
        {new Date(row.created_at).toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </time>
    ),
  },
  {
    id: "amount",
    header: "Amount",
    align: "right",
    cellClassName: "tabular-nums",
    renderCell: (row) => (
      <span className="text-content-secondary">
        {row.amount} {row.currency.toUpperCase()}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    renderCell: (row) => (
      <span className="capitalize text-content-secondary">{row.status}</span>
    ),
  },
  {
    id: "order",
    header: "Order",
    renderCell: (row) => (
      <Link
        to={`/orders/${encodeURIComponent(row.order_id)}`}
        className="text-interactive-primary hover:text-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
      >
        View order
      </Link>
    ),
  },
]

type SubscriptionRenewalLogTableProps = {
  rows: readonly AdminRenewalLogRow[]
  isLoading?: boolean
}

export function SubscriptionRenewalLogTable({
  rows,
  isLoading = false,
}: SubscriptionRenewalLogTableProps): ReactNode {
  return (
    <DataTable<AdminRenewalLogRow, RenewalLogColumn>
      aria-label="Renewal log"
      columns={RENEWAL_LOG_COLUMNS}
      data={[...rows]}
      getRowId={(row) => row.id}
      sortState={{ column: null, direction: "none" }}
      onRequestSort={() => {}}
      hasRowActions={false}
      isLoading={isLoading}
      emptyState={
        <ListEmptyState
          bare
          title="No renewals yet"
          description="Successful and failed renewal attempts appear here."
        />
      }
    />
  )
}
