import type { ReactNode } from "react"

import { DiscountStatusBadge } from "@/components/discounts/DiscountStatusBadge"
import type { ListColumnDef } from "@/components/ui/list/types"
import type { AdminDiscountRow } from "@/features/discounts/types"

export type DiscountListSortColumn = "name" | "type" | "method" | "status" | "usage" | "expires_at"

function formatUsage(row: AdminDiscountRow): string {
  if (row.usage_limit === null) {
    return String(row.usage_count)
  }
  return `${row.usage_count}/${row.usage_limit}`
}

function formatExpiry(expiresAt: string | null): string {
  if (expiresAt === null) {
    return "No expiry"
  }
  const date = new Date(expiresAt)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export const DISCOUNT_LIST_COLUMNS: ListColumnDef<AdminDiscountRow, DiscountListSortColumn>[] = [
  {
    id: "name",
    header: "Name",
    sortable: true,
    getSortValue: (row) => row.name.toLocaleLowerCase(),
    cellClassName: "font-medium",
    renderCell: (row) => row.name,
  },
  {
    id: "type",
    header: "Type",
    sortable: true,
    getSortValue: (row) => row.type,
    renderCell: (row) => row.type,
  },
  {
    id: "method",
    header: "Method",
    sortable: true,
    getSortValue: (row) => row.method,
    renderCell: (row) => row.method,
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    getSortValue: (row) => row.status,
    renderCell: (row): ReactNode => <DiscountStatusBadge status={row.status} />,
  },
  {
    id: "usage",
    header: "Usage",
    sortable: true,
    getSortValue: (row) => row.usage_count,
    renderCell: (row) => formatUsage(row),
  },
  {
    id: "expires_at",
    header: "Expiry",
    sortable: true,
    getSortValue: (row) => row.expires_at ?? "",
    renderCell: (row) => formatExpiry(row.expires_at),
  },
]
