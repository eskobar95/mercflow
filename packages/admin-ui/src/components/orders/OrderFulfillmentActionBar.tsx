import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/Button"
import { DialogFooter, DialogShell } from "@/components/ui/Dialog"
import { Label } from "@/components/ui/Label"
import {
  fetchFirstStockLocationId,
  postCaptureAdminPayment,
  postCreateFulfillmentShipment,
  postCreateOrderFulfillment,
  postOrderAdminNote,
} from "@/features/orders/orderFulfillmentAdminApi"
import { getOrderFulfillmentActionVisibility } from "@/features/orders/orderFulfillmentActionState"
import type { OrderDetail } from "@/features/orders/orderTypes"

type ConfirmKind = "capture" | "create_fulfillment" | "mark_shipped"

export function OrderFulfillmentActionBar(props: {
  order: OrderDetail
  onDidMutate: () => void
}): JSX.Element {
  const { order, onDidMutate } = props
  const visibility = useMemo(
    () => getOrderFulfillmentActionVisibility(order),
    [order],
  )

  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null)
  const [mutationLoading, setMutationLoading] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const [stockLocationId, setStockLocationId] = useState<string | null>(null)
  const [stockLocationLoading, setStockLocationLoading] = useState(false)
  const [stockLocationError, setStockLocationError] = useState<string | null>(null)

  const [noteDraft, setNoteDraft] = useState("")
  const [noteSubmitting, setNoteSubmitting] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [noteSuccessVisible, setNoteSuccessVisible] = useState(false)

  const closeDialog = useCallback((): void => {
    setConfirmKind(null)
    setStockLocationId(null)
    setStockLocationError(null)
    setStockLocationLoading(false)
  }, [])

  useEffect(() => {
    if (confirmKind !== "create_fulfillment") {
      return
    }
    let cancelled = false
    const run = async (): Promise<void> => {
      setStockLocationLoading(true)
      setStockLocationError(null)
      try {
        const id = await fetchFirstStockLocationId()
        if (!cancelled) {
          setStockLocationId(id)
          if (id === null) {
            setStockLocationError(
              "No stock location is available. Create a stock location in Medusa before fulfilling.",
            )
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load stock locations"
        if (!cancelled) {
          setStockLocationError(msg)
        }
      } finally {
        if (!cancelled) {
          setStockLocationLoading(false)
        }
      }
    }
    void run()
    return (): void => {
      cancelled = true
    }
  }, [confirmKind])

  const runMutation = useCallback(async (): Promise<void> => {
    setMutationError(null)
    setMutationLoading(true)
    try {
      if (confirmKind === "capture") {
        const paymentId = visibility.capturablePaymentId
        if (paymentId === null) {
          throw new Error(
            "No capturable payment id was returned for this order. Expand Medusa order query fields or capture from Medusa admin.",
          )
        }
        await postCaptureAdminPayment(paymentId)
      } else if (confirmKind === "create_fulfillment") {
        if (stockLocationId === null) {
          throw new Error("Pick or create a stock location before fulfilling.")
        }
        if (visibility.fulfillmentItemsPayload.length === 0) {
          throw new Error("There are no remaining line items to fulfill.")
        }
        await postCreateOrderFulfillment(order.id, {
          items: visibility.fulfillmentItemsPayload,
          location_id: stockLocationId,
        })
      } else if (confirmKind === "mark_shipped") {
        const fulfillmentId = visibility.unshippedFulfillmentId
        if (fulfillmentId === null) {
          throw new Error("No unshipped fulfillment is available.")
        }
        await postCreateFulfillmentShipment(order.id, fulfillmentId)
      }
      closeDialog()
      onDidMutate()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Action failed"
      setMutationError(msg)
    } finally {
      setMutationLoading(false)
    }
  }, [
    closeDialog,
    confirmKind,
    onDidMutate,
    order.id,
    stockLocationId,
    visibility.capturablePaymentId,
    visibility.fulfillmentItemsPayload,
    visibility.unshippedFulfillmentId,
  ])

  const dialogMeta = useMemo(() => {
    if (confirmKind === "capture") {
      return {
        title: "Capture payment?",
        description:
          "This captures the authorized or awaiting payment for this order so you can fulfill it. Customers may see the charge finalize depending on their bank.",
      }
    }
    if (confirmKind === "create_fulfillment") {
      return {
        title: "Create fulfillment?",
        description:
          "This registers a fulfillment in Medusa for all remaining quantities on this order, using your default stock location. Inventory reservations apply according to your Medusa configuration.",
      }
    }
    if (confirmKind === "mark_shipped") {
      return {
        title: "Mark as shipped?",
        description:
          "This marks the open fulfillment as shipped in Medusa. Update tracking in Medusa later if your workflow requires carrier references.",
      }
    }
    return { title: "", description: "" }
  }, [confirmKind])

  const submitNote = useCallback(async (): Promise<void> => {
    setNoteError(null)
    setNoteSuccessVisible(false)
    setNoteSubmitting(true)
    try {
      await postOrderAdminNote(order.id, noteDraft)
      setNoteDraft("")
      setNoteSuccessVisible(true)
      onDidMutate()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save note"
      setNoteError(msg)
    } finally {
      setNoteSubmitting(false)
    }
  }, [noteDraft, onDidMutate, order.id])

  const hasAnyActionButton =
    visibility.showCapturePayment ||
    visibility.showCreateFulfillment ||
    visibility.showMarkShipped

  return (
    <section
      aria-label="Order fulfillment actions"
      className="mb-6 rounded-lg border border-border-subtle bg-surface-subtle px-4 py-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-content-primary">Actions</h2>
      <p className="mt-1 text-xs text-content-secondary">
        Context-sensitive workflow steps backed by Medusa admin APIs; the timeline refreshes after each
        step.
      </p>

      {mutationError !== null ? (
        <p
          className="mt-3 rounded-md border border-feedback-danger-border bg-feedback-danger-subtle px-3 py-2 text-sm text-feedback-danger-content"
          role="alert"
        >
          {mutationError}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {visibility.showCapturePayment ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={mutationLoading}
            onClick={() => {
              setMutationError(null)
              setConfirmKind("capture")
            }}
          >
            Capture payment
          </Button>
        ) : null}
        {visibility.showCreateFulfillment ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={mutationLoading}
            onClick={() => {
              setMutationError(null)
              setConfirmKind("create_fulfillment")
            }}
          >
            Create fulfillment
          </Button>
        ) : null}
        {visibility.showMarkShipped ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={mutationLoading}
            onClick={() => {
              setMutationError(null)
              setConfirmKind("mark_shipped")
            }}
          >
            Mark as shipped
          </Button>
        ) : null}
        {!hasAnyActionButton ? (
          <p className="text-sm text-content-secondary">No workflow actions apply to this status.</p>
        ) : null}
      </div>

      <div className="mt-6 border-t border-border-subtle pt-4">
        <Label className="text-content-primary" htmlFor="order-admin-note" id="order-admin-note-label">
          Internal note
        </Label>
        <p id="order-admin-note-hint" className="mt-1 text-xs text-content-tertiary">
          Stored as a Medusa order note for your team ({order.currencyCode.toUpperCase()} order #{order.displayId}).
        </p>
        <textarea
          id="order-admin-note"
          aria-labelledby="order-admin-note-label"
          aria-describedby="order-admin-note-hint"
          rows={3}
          value={noteDraft}
          disabled={noteSubmitting}
          onChange={(ev) => {
            setNoteDraft(ev.target.value)
          }}
          className="mt-2 w-full max-w-xl rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus disabled:opacity-60"
        />
        {noteError !== null ? (
          <p className="mt-2 text-sm text-feedback-danger-content" role="alert">
            {noteError}
          </p>
        ) : null}
        {noteSuccessVisible ? (
          <p className="mt-2 text-sm text-feedback-success-content" role="status">
            Note saved.
          </p>
        ) : null}
        <div className="mt-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={noteSubmitting || noteDraft.trim() === ""}
            onClick={() => {
              void submitNote()
            }}
          >
            Add note
          </Button>
        </div>
      </div>

      <DialogShell
        open={confirmKind !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          }
        }}
        title={dialogMeta.title}
        description={dialogMeta.description}
        footer={
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={mutationLoading}
              onClick={() => {
                closeDialog()
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={
                mutationLoading ||
                (confirmKind === "create_fulfillment" &&
                  (stockLocationLoading ||
                    stockLocationId === null ||
                    stockLocationError !== null))
              }
              onClick={() => {
                void runMutation()
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
              <span className="font-medium text-content-primary">
                {visibility.fulfillmentItemsPayload.length}
              </span>{" "}
              line row(s).
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
    </section>
  )
}
