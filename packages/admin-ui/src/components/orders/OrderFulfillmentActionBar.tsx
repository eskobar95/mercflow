import { type ReactNode, useCallback, useEffect, useMemo, useReducer } from "react"

import { Button } from "@/components/ui/Button"
import {
  fetchFirstStockLocationId,
  postCaptureAdminPayment,
  postCreateFulfillmentShipment,
  postCreateOrderFulfillment,
} from "@/features/orders/orderFulfillmentAdminApi"
import { postShipmondoShipmentLabel } from "@/features/orders/orderShipmondoLabelApi"
import { getOrderFulfillmentActionVisibility } from "@/features/orders/orderFulfillmentActionState"
import type { OrderDetail } from "@/features/orders/orderTypes"
import { useShipmondoLabelGenerationReady } from "@/hooks/useShipmondoLabelGenerationReady"

import { OrderFulfillmentConfirmDialog } from "./OrderFulfillmentConfirmDialog"
import {
  OrderShipmondoGenerateLabelButton,
  OrderShipmondoLabelOutcome,
} from "./OrderShipmondoLabelSection"
import {
  INITIAL_ORDER_FULFILLMENT_BAR_STATE,
  orderFulfillmentBarReducer,
  resolveOrderFulfillmentDialogMeta,
} from "./orderFulfillmentBarState"

export function OrderFulfillmentActionBar(props: {
  order: OrderDetail
  confirmedPackagingTypeId: string | null
  shipmondoLabelBlockReason: string | null
  onDidMutate: () => void
}): ReactNode {
  const { order, confirmedPackagingTypeId, shipmondoLabelBlockReason, onDidMutate } = props
  const visibility = useMemo(
    () => getOrderFulfillmentActionVisibility(order),
    [order],
  )
  const { isReady: shipmondoLabelReady, isLoading: shipmondoReadyLoading } =
    useShipmondoLabelGenerationReady()

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
    labelLoading,
    labelError,
    labelResult,
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

  const handleGenerateLabel = useCallback((): void => {
    const fulfillmentId = visibility.labelFulfillmentId
    if (fulfillmentId === null) {
      dispatch({ type: "labelError", message: "No fulfillment is available for label generation." })
      return
    }

    dispatch({ type: "labelStart" })
    void postShipmondoShipmentLabel({
      fulfillmentId,
      packagingTypeId: confirmedPackagingTypeId,
    })
      .then((result) => {
        dispatch({
          type: "labelSuccess",
          trackingUrl: result.trackingUrl,
          labelPdfBase64: result.labelPdfBase64,
          reference: result.reference,
        })
        onDidMutate()
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Failed to generate Shipmondo label"
        dispatch({ type: "labelError", message })
      })
      .finally(() => {
        dispatch({ type: "labelFinish" })
      })
  }, [confirmedPackagingTypeId, onDidMutate, visibility.labelFulfillmentId])

  const dialogMeta = useMemo(
    () => resolveOrderFulfillmentDialogMeta(confirmKind),
    [confirmKind],
  )

  const hasAnyActionButton =
    visibility.showCapturePayment ||
    visibility.showCreateFulfillment ||
    visibility.showMarkShipped ||
    (visibility.showGenerateLabel && shipmondoLabelReady)

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

      {shipmondoLabelBlockReason !== null && visibility.showGenerateLabel && shipmondoLabelReady ? (
        <p className="mt-3 text-sm text-content-secondary" role="status">
          {shipmondoLabelBlockReason}
        </p>
      ) : null}

      <OrderShipmondoLabelOutcome labelError={labelError} labelResult={labelResult} />

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
        {visibility.showGenerateLabel && shipmondoLabelReady ? (
          <OrderShipmondoGenerateLabelButton
            disabled={
              labelLoading || shipmondoReadyLoading || shipmondoLabelBlockReason !== null
            }
            loading={labelLoading}
            onGenerateLabel={handleGenerateLabel}
          />
        ) : null}
        {!hasAnyActionButton ? (
          <p className="text-sm text-content-secondary">No workflow actions apply to this status.</p>
        ) : null}
      </div>

      <OrderFulfillmentConfirmDialog
        confirmKind={confirmKind}
        title={dialogMeta.title}
        description={dialogMeta.description}
        mutationLoading={mutationLoading}
        stockLocationLoading={stockLocationLoading}
        stockLocationId={stockLocationId}
        stockLocationError={stockLocationError}
        fulfillmentItemCount={visibility.fulfillmentItemsPayload.length}
        onClose={closeDialog}
        onConfirm={runMutation}
      />
    </section>
  )
}
