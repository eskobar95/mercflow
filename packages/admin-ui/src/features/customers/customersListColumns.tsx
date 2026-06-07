import { Link } from "react-router-dom"

import {
  CustomersLifetimeValueCell,
  CustomersOrderCountCell,
} from "@/components/customers/CustomersDirectoryMetricCells"
import type { SortOption } from "@/components/ui/list/ListSortControl"
import type { ListColumnDef } from "@/components/ui/list/types"
import {
  customerDisplayName,
  customerEmailLabel,
} from "@/features/customers/customerFormatting"
import type { CustomersDirectoryRow, CustomersDirectorySortCol } from "@/features/customers/hooks/useCustomersDirectory"
import { summarizeLifetimeDisplayText } from "@/features/customers/customersPaidSpend"

export const CUSTOMERS_LIST_SORT_OPTIONS: SortOption<CustomersDirectorySortCol>[] = [
  { id: "name", label: "Name" },
  { id: "email", label: "Email" },
  { id: "orderCount", label: "Orders" },
  { id: "lifetime", label: "Lifetime value" },
  { id: "joined", label: "Customer since" },
]

export const CUSTOMERS_LIST_COLUMNS: ListColumnDef<CustomersDirectoryRow, CustomersDirectorySortCol>[] = [
  {
    id: "name",
    header: "Name",
    sortable: true,
    getSortValue: (row) => customerDisplayName(row.customer).toLocaleLowerCase(),
    cellClassName: "font-medium",
    renderCell: (row) => (
      <Link
        to={`/customers/${encodeURIComponent(row.customer.id)}`}
        className="text-interactive-primary hover:text-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
      >
        {customerDisplayName(row.customer)}
      </Link>
    ),
  },
  {
    id: "email",
    header: "Email",
    sortable: true,
    getSortValue: (row) => (row.customer.email ?? "").toLocaleLowerCase(),
    renderCell: (row) => customerEmailLabel(row.customer),
  },
  {
    id: "orderCount",
    header: "Orders",
    sortable: true,
    align: "right",
    getSortValue: (row) =>
      row.spend.status === "ready" ? row.spend.summary.totalOrderCount : Number.NEGATIVE_INFINITY,
    cellClassName: "tabular-nums",
    renderCell: (row) => <CustomersOrderCountCell row={row} />,
  },
  {
    id: "lifetime",
    header: "Lifetime value",
    sortable: true,
    align: "right",
    getSortValue: (row): number => {
      if (row.spend.status !== "ready") {
        return Number.NEGATIVE_INFINITY
      }
      const view = summarizeLifetimeDisplayText(row.spend.summary)
      if (view.kind !== "single") {
        return 0
      }
      return Number(view.minor)
    },
    renderCell: (row) => <CustomersLifetimeValueCell row={row} />,
  },
  {
    id: "joined",
    header: "Customer since",
    sortable: true,
    getSortValue: (row) => new Date(row.customer.created_at),
    renderCell: (row) => (
      <time dateTime={row.customer.created_at} className="text-content-secondary">
        {new Date(row.customer.created_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </time>
    ),
  },
]
