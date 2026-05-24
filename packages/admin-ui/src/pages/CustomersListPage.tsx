import { useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"

import {
  CustomersLifetimeValueCell,
  CustomersOrderCountCell,
} from "@/components/customers/CustomersDirectoryMetricCells"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"
import { ListToolbar } from "@/components/ui/list/ListToolbar"
import { type RowActionItem } from "@/components/ui/list/RowActionsMenu"
import { type ListColumnDef } from "@/components/ui/list/types"
import {
  customerDisplayName,
  customerEmailLabel,
} from "@/features/customers/customerFormatting"
import {
  type CustomersDirectoryRow,
  type CustomersDirectorySortCol,
  useCustomersDirectory,
} from "@/features/customers/hooks/useCustomersDirectory"
import { summarizeLifetimeDisplayText } from "@/features/customers/customersPaidSpend"

const SEARCH_DEBOUNCE_MS = 320

type CustomersCol = CustomersDirectorySortCol

const CUSTOMER_COLUMNS: ListColumnDef<CustomersDirectoryRow, CustomersCol>[] = [
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
    getSortValue: (row) =>
      row.spend.status === "ready" ? row.spend.summary.totalOrderCount : Number.NEGATIVE_INFINITY,
    cellClassName: "tabular-nums",
    renderCell: (row) => <CustomersOrderCountCell row={row} />,
  },
  {
    id: "lifetime",
    header: "Lifetime value",
    sortable: true,
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

export function CustomersListPage(): JSX.Element {
  const navigate = useNavigate()
  const {
    hasBackendConfiguration,
    searchInput,
    setSearchInput,
    sortedRows,
    isListLoading,
    listError,
    totalCount,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    sort,
    requestSort,
  } = useCustomersDirectory()

  const getRowActions = useCallback(
    (row: CustomersDirectoryRow): RowActionItem[] => {
      return [
        {
          id: "detail",
          label: "Open customer",
          onSelect: () => {
            navigate(`/customers/${encodeURIComponent(row.customer.id)}`)
          },
        },
      ]
    },
    [navigate]
  )

  if (!hasBackendConfiguration) {
    return (
      <div className="p-6">
        <section
          className="rounded-lg border border-border-default bg-feedback-warning-subtle px-6 py-5 text-sm text-feedback-warning-content shadow-sm"
          role="alert"
        >
          <h1 className="text-lg font-semibold text-feedback-warning-content">
            Backend URL missing
          </h1>
          <p className="mt-2 leading-relaxed">
            Configure{" "}
            <code className="rounded-sm border border-feedback-warning-border bg-surface-raised px-1 py-0.5 text-xs">
              VITE_MEDUSA_ADMIN_BACKEND_URL
            </code>{" "}
            and, if needed,{" "}
            <code className="rounded-sm border border-feedback-warning-border bg-surface-raised px-1 py-0.5 text-xs">
              VITE_MEDUSA_ADMIN_BEARER_TOKEN
            </code>{" "}
            inside your Vite env so this workspace can authenticate against Medusa Admin.
          </p>
        </section>
      </div>
    )
  }

  const startIndex =
    sortedRows.length === 0 ? 0 : Math.min(totalCount, (currentPage - 1) * pageSize + 1)
  const endIndex =
    sortedRows.length === 0 ? 0 : Math.min(totalCount, (currentPage - 1) * pageSize + sortedRows.length)

  return (
    <div className="p-6">
      <div className="overflow-hidden rounded-lg border border-border-default bg-surface-default shadow-sm">
        <ListToolbar
          title="Customers"
          description="Search guests and registered customers, inspect captured revenue, then open profiles for richer order timelines."
          end={
            <p className="max-w-xs text-xs text-content-tertiary">
              Showing {sortedRows.length === 0 ? 0 : startIndex}-{endIndex} of{" "}
              <span className="font-semibold text-content-secondary">{totalCount}</span>
            </p>
          }
        >
          <label className="flex min-w-0 max-w-md flex-1 items-center gap-2">
            <span className="shrink-0 text-sm text-content-secondary">Search</span>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value)
              }}
              placeholder="Customer name or email"
              className="min-w-0 flex-1 rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus"
              aria-label="Search customers by name or email"
            />
          </label>
          <span className="text-xs text-content-tertiary">
            Queries debounce ({SEARCH_DEBOUNCE_MS} ms) after typing
          </span>
        </ListToolbar>

        {listError ? (
          <div
            className="border-b border-feedback-danger-border bg-feedback-danger-subtle px-6 py-3 text-sm text-feedback-danger-content"
            role="alert"
          >
            {listError}
          </div>
        ) : null}

        <DataTable<CustomersDirectoryRow, CustomersCol>
          aria-label="Customer directory"
          caption="MercFlow customer directory backed by Medusa Admin search"
          columns={CUSTOMER_COLUMNS}
          data={sortedRows}
          getRowId={(row) => row.customer.id}
          sortState={sort}
          onRequestSort={requestSort}
          getRowActions={getRowActions}
          isLoading={isListLoading}
          hasRowActions
          emptyState={
            <ListEmptyState
              title="No customers match"
              description="Try widening your filters or resetting the debounced query — Medusa matches name and email."
              action={
                searchInput.trim() !== "" ? (
                  <button
                    type="button"
                    className="rounded-md border border-border-default bg-surface-raised px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm"
                    onClick={() => {
                      setSearchInput("")
                    }}
                  >
                    Clear search
                  </button>
                ) : undefined
              }
            />
          }
        />
        <ListPagination
          aria-label="Customer directory pagination"
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalCount}
          onPageChange={setCurrentPage}
          onPageSizeChange={(next) => {
            setPageSize(next)
          }}
        />
      </div>
    </div>
  )
}
