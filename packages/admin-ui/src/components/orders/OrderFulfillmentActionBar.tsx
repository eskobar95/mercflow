import { type ReactNode, useCallback, useEffect, useMemo, useReducer } from "react"

import { Button } from "@/components/ui/Button"
import { DialogFooter, DialogShell } from "@/components/ui/Dialog"
import {
  fetchFirstStockLocationId,
  postCaptureAdminPayment,
  postCreateFulfillmentShipment,
  postCreateOrderFulfillment,
} from "@/features/orders/orderFulfillmentAdminApi"
import { getOrderFulfillmentActionVisibility } from "@/features/orders/orderFulfillmentActionState"
import type { OrderDetail } from "@/features/orders/orderTypes"

type ConfirmKind = "capture" | "create_fulfillment" | "mark_shipped"

type OrderFulfillmentBarState = {
  confirmKind: ConfirmKind | null
  mutationLoading: boolean
  mutationError: string | null
  stockLocationId: string | null
  stockLocationLoading: boolean
  stockLocationError: string | null
}

type OrderFulfillmentBarAction =
  | { type: "openConfirm"; kind: ConfirmKind }
  | { type: "closeDialog" }
  | { type: "mutationStart" }
  | { type: "mutationError"; message: string }
  | { type: "mutationFinish" }
  | { type: "stockLocationStart" }
  | { type: "stockLocationSuccess"; id: string | null; error: string | null }
  | { type: "stockLocationError"; message: string }
  | { type: "stockLocationFinish" }

const INITIAL_ORDER_FULFILLMENT_BAR_STATE: OrderFulfillmentBarState = {
  confirmKind: null,
  mutationLoading: false,
  mutationError: null,
  stockLocationId: null,
  stockLocationLoading: false,
  stockLocationError: null,
}

function orderFulfillmentBarReducer(
  state: OrderFulfillmentBarState,
  action: OrderFulfillmentBarAction,
): OrderFulfillmentBarState {
  switch (action.type) {
    case "openConfirm":
      return { ...state, confirmKind: action.kind, mutationError: null }
    case "closeDialog":
      return {
        ...state,
        confirmKind: null,
        stockLocationId: null,
        stockLocationError: null,
        stockLocationLoading: false,
      }
    case "mutationStart":
      return { ...state, mutationError: null, mutationLoading: true }
    case "mutationError":
      return { ...state, mutationError: action.message, mutationLoading: false }
    case "mutationFinish":
      return { ...state, mutationLoading: false }
    case "stockLocationStart":
      return { ...state, stockLocationLoading: true, stockLocationError: null }
    case "stockLocationSuccess":
      return {
        ...state,
        stockLocationId: action.id,
        stockLocationError: action.error,
        stockLocationLoading: false,
      }
    case "stockLocationError":
      return { ...state, stockLocationError: action.message, stockLocationLoading: false }
    case "stockLocationFinish":
      return { ...state, stockLocationLoading: false }
    default:
      return state
  }
}

export function OrderFulfillmentActionBar(props: {
  order: OrderDetail
  onDidMutate: () => void
}): ReactNode {
  const { order, onDidMutate } = props
  const visibility = useMemo(
    () => getOrderFulfillmentActionVisibility(order),
    [order],
  )

  const [ui, dispatch] = useReducer(
    orderFulfillmentBarReducer,
    INITIAL_ORDER_FULFILLMENT_BAR_STATE,
  )
  const {
    confirmKind,
    mutationLoading,
    mutationError,
    stockLocationId,
    stockLocationLoading,
    stockLocationError,
  } = ui

  const closeDialog = useCallback((): void => {
    dispatch({ type: "closeDialog" })
  }, [])

  useEffect(() => {
    if (confirmKind !== "create_fulfillment") {
      return
    }
    let cancelled = false
    const run = async (): Promise<void> => {
      dispatch({ type: "stockLocationStart" })
      try {
        const id = await fetchFirstStockLocationId()
        if (!cancelled) {
          dispatch({
            type: "stockLocationSuccess",
            id,
            error:
              id === null
                ? "No stock location is available. Create a stock location in Medusa before fulfilling."
                : null,
          })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load stock locations"
        if (!cancelled) {
          dispatch({ type: "stockLocationError", message: msg })
        }
      } finally {
        if (!cancelled) {
          dispatch({ type: "stockLocationFinish" })
        }
      }
    }
    void run()
    return (): void => {
      cancelled = true
    }
  }, [confirmKind])

  const runMutation = useCallback(async (): Promise<void> => {
    dispatch({ type: "mutationStart" })
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
        const shipmentItems = visibility.shipmentItemsPayload
        await postCreateFulfillmentShipment(
          order.id,
          fulfillmentId,
          shipmentItems.length > 0 ? { items: shipmentItems } : undefined,
        )
      }
      closeDialog()
      onDidMutate()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Action failed"
      dispatch({ type: "mutationError", message: msg })
    } finally {
      dispatch({ type: "mutationFinish" })
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
    visibility.shipmentItemsPayload,
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
              dispatch({ type: "openConfirm", kind: "capture" })
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
              dispatch({ type: "openConfirm", kind: "create_fulfillment" })
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
              dispatch({ type: "openConfirm", kind: "mark_shipped" })
            }}
          >
            Mark as shipped
          </Button>
        ) : null}
        {!hasAnyActionButton ? (
          <p className="text-sm text-content-secondary">No workflow actions apply to this status.</p>
        ) : null}
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
