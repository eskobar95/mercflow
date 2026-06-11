import type { ReactNode } from "react"

import { EmailDeliveryStatusBadge } from "@/components/notifications/EmailDeliveryStatusBadge"
import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { ListPagination } from "@/components/ui/list/ListPagination"

import {
  EMAIL_DELIVERY_PAGE_SIZE,
  useEmailDeliveryHistoryTab,
} from "./useEmailDeliveryHistoryTab"

const NO_SORT = { column: null, direction: "none" as const }

export function EmailDeliveryHistoryTab(): ReactNode {
  const {
    state,
    dispatch,
    columns,
    getRowActions,
    onRowClick,
    reload,
    resendDelivery,
    expandedRow,
  } = useEmailDeliveryHistoryTab()

  const { rows, count, page, phase, message, resendingId } = state

  if (phase === "error") {
    return (
      <div
        role="alert"
        className="rounded-lg border border-feedback-danger-border bg-feedback-danger-subtle p-6 text-sm text-feedback-danger-content"
      >
        {message}
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => {
            void reload()
          }}
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {message !== null ? (
        <p role="alert" className="text-sm text-content-danger">
          {message}
        </p>
      ) : null}

      <DataTable
        aria-label="Email delivery history"
        caption="Transactional email deliveries for this store"
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        sortState={NO_SORT}
        onRequestSort={() => {
          // Server-ordered by created_at desc.
        }}
        getRowActions={getRowActions}
        onRowClick={onRowClick}
        isLoading={phase === "loading"}
        emptyState={
          <ListEmptyState
            title="No emails sent yet"
            description="Order confirmations, shipping updates, and other transactional emails will appear here after they are queued."
          />
        }
      />

      {expandedRow !== null ? (
        <section
          aria-label="Delivery error details"
          className="rounded-lg border border-border-subtle bg-surface-subtle p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <EmailDeliveryStatusBadge status={expandedRow.status} />
                <span className="text-sm font-medium text-content-primary">
                  {expandedRow.to_email}
                </span>
              </div>
              <p className="text-sm text-content-secondary">
                {expandedRow.error_message ?? "No error message recorded for this delivery."}
              </p>
            </div>
            {(expandedRow.status === "failed" || expandedRow.status === "dead_letter") && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={resendingId !== null}
                onClick={() => {
                  void resendDelivery(expandedRow)
                }}
              >
                {resendingId === expandedRow.id ? "Resending…" : "Resend"}
              </Button>
            )}
          </div>
        </section>
      ) : null}

      {count > 0 ? (
        <ListPagination
          aria-label="Email delivery history pagination"
          currentPage={page}
          pageSize={EMAIL_DELIVERY_PAGE_SIZE}
          totalItems={count}
          pageSizeOptions={[EMAIL_DELIVERY_PAGE_SIZE]}
          onPageChange={(nextPage) => {
            dispatch({ type: "setPage", page: nextPage })
          }}
          onPageSizeChange={() => {
            // Fixed at 50 per task spec.
          }}
        />
      ) : null}
    </div>
  )
}
