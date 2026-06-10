import type { ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { DialogFooter, DialogShell } from "@/components/ui/Dialog"

import type { ConfirmKind } from "./orderFulfillmentBarState"

export function OrderFulfillmentConfirmDialog(props: {
  confirmKind: ConfirmKind | null
  title: string
  description: string
  mutationLoading: boolean
  stockLocationLoading: boolean
  stockLocationId: string | null
  stockLocationError: string | null
  fulfillmentItemCount: number
  onClose: () => void
  onConfirm: () => void
}): ReactNode {
  const {
    confirmKind,
    title,
    description,
    mutationLoading,
    stockLocationLoading,
    stockLocationId,
    stockLocationError,
    fulfillmentItemCount,
    onClose,
    onConfirm,
  } = props

  return (
    <DialogShell
      open={confirmKind !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      title={title}
      description={description}
      footer={
        <DialogFooter>
          <Button type="button" variant="secondary" disabled={mutationLoading} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={
              mutationLoading ||
              (confirmKind === "create_fulfillment" &&
                (stockLocationLoading || stockLocationId === null || stockLocationError !== null))
            }
            onClick={() => {
              void onConfirm()
            }}
          >
            {mutationLoading ? "Working…" : "Confirm"}
          </Button>
        </DialogFooter>
      }
    >
      {confirmKind === "create_fulfillment" ? (
        <div className="space-y-2 text-sm text-content-secondary">
          <p>
            Fulfill{" "}
            <span className="font-medium text-content-primary">{fulfillmentItemCount}</span> line
            row(s).
          </p>
          {stockLocationLoading ? <p aria-live="polite">Loading stock location…</p> : null}
          {stockLocationError !== null ? (
            <p className="text-feedback-danger-content" role="alert">
              {stockLocationError}
            </p>
          ) : null}
          {stockLocationId !== null && stockLocationError === null ? (
            <p aria-live="polite">
              Using stock location{" "}
              <code className="rounded bg-surface-subtle px-1 py-0.5 text-xs text-content-primary">
                {stockLocationId}
              </code>
            </p>
          ) : null}
        </div>
      ) : null}
    </DialogShell>
  )
}
