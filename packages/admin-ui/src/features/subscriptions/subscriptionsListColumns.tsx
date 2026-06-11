import { Link } from "react-router-dom"

import { SubscriptionIntervalBadge } from "@/components/subscriptions/SubscriptionIntervalBadge"
import { SubscriptionStatusBadge } from "@/components/subscriptions/SubscriptionStatusBadge"
import type { SortOption } from "@/components/ui/list/ListSortControl"
import type { ListColumnDef } from "@/components/ui/list/types"
import type { AdminSubscriptionRow } from "@/features/subscriptions"
import { canonicalSubscriptionUiStatus } from "@/features/subscriptions/subscriptionUi"

export type SubscriptionListSortColumn =
  | "customer"
  | "product"
  | "status"
  | "interval"
  | "renewal"

export const SUBSCRIPTION_LIST_SORT_OPTIONS: SortOption<SubscriptionListSortColumn>[] = [
  { id: "customer", label: "Customer" },
  { id: "product", label: "Product" },
  { id: "status", label: "Status" },
  { id: "interval", label: "Interval" },
  { id: "renewal", label: "Next renewal" },
]

export const SUBSCRIPTION_LIST_COLUMNS: ListColumnDef<
  AdminSubscriptionRow,
  SubscriptionListSortColumn
>[] = [
  {
    id: "customer",
    header: "Customer",
    sortable: true,
    getSortValue: (row) => row.customer_display ?? "",
    cellClassName: "font-medium",
    renderCell: (row) => (
      <Link
        to={`/customers/${encodeURIComponent(row.customer_id)}`}
        className="text-interactive-primary hover:text-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
      >
        {row.customer_display ?? row.customer_id}
      </Link>
    ),
  },
  {
    id: "product",
    header: "Product / variant",
    sortable: true,
    getSortValue: (row) => row.product_label ?? "",
    renderCell: (row) => (
      <Link
        to={`/subscriptions/${encodeURIComponent(row.id)}`}
        className="text-content-primary hover:text-interactive-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
      >
        {row.product_label ?? row.variant_id}
      </Link>
    ),
  },
  {
    id: "interval",
    header: "Interval",
    sortable: true,
    getSortValue: (row) => row.interval,
    renderCell: (row) => <SubscriptionIntervalBadge interval={row.interval} />,
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    getSortValue: (row) => row.status,
    renderCell: (row) => <SubscriptionStatusBadge status={row.status} />,
  },
  {
    id: "renewal",
    header: "Next renewal",
    sortable: true,
    getSortValue: (row) => {
      const date = row.next_renewal_at
      if (date == null) {
        return 0
      }
      return new Date(date).getTime()
    },
    renderCell: (row) => {
      if (row.next_renewal_at == null) {
        return <span className="text-content-tertiary">—</span>
      }
      return (
        <time dateTime={row.next_renewal_at} className="text-content-secondary">
          {new Date(row.next_renewal_at).toLocaleString(undefined, {
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
]

export function subscriptionMatchesStatusFilter(
  row: AdminSubscriptionRow,
  activeStatusIds: string[],
  operator: "is" | "is not",
): boolean {
  if (activeStatusIds.length === 0) {
    return true
  }
  const canonical = canonicalSubscriptionUiStatus(row.status)
  const matches = activeStatusIds.some((statusId) => {
    if (statusId === "past_due") {
      return canonical === "past_due" || canonical === "pending_payment"
    }
    return statusId === canonical
  })
  return operator === "is" ? matches : !matches
}

export function subscriptionMatchesSearch(row: AdminSubscriptionRow, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (normalized.length === 0) {
    return true
  }
  return (
    (row.customer_display ?? "").toLowerCase().includes(normalized) ||
    (row.product_label ?? "").toLowerCase().includes(normalized) ||
    row.status.toLowerCase().includes(normalized)
  )
}
