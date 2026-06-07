import type { ReactNode } from "react"

import { BulkActionBar } from "@/components/ui/list/BulkActionBar"
import { bulkActionButtonClass } from "@/components/ui/list/bulkActionBarStyles"

type OrdersListBulkActionsProps = {
  selectedCount: number
  bulkLoading: boolean
  bulkMessage: string | null
  onClearSelection: () => void
  onMarkFulfillmentReady: () => void
}

export function OrdersListBulkActions({
  selectedCount,
  bulkLoading,
  bulkMessage,
  onClearSelection,
  onMarkFulfillmentReady,
}: OrdersListBulkActionsProps): ReactNode | null {
  if (selectedCount === 0) {
    return null
  }

  return (
    <>
      <BulkActionBar count={selectedCount} noun="order" onClear={onClearSelection}>
        <button
          type="button"
          className={bulkActionButtonClass}
          disabled={bulkLoading}
          onClick={onMarkFulfillmentReady}
        >
          {bulkLoading ? "Working…" : "Mark fulfillment-ready"}
        </button>
      </BulkActionBar>
      {bulkMessage !== null ? (
        <p
          className="pointer-events-none fixed bottom-24 left-1/2 z-sticky -translate-x-1/2 rounded-md border border-border-default bg-surface-raised px-3 py-2 text-sm text-content-secondary shadow-md"
          role="status"
        >
          {bulkMessage}
        </p>
      ) : null}
    </>
  )
}
