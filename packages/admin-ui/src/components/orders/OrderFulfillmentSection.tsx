import { type ReactNode, useCallback, useState } from "react"

import type { OrderDetail } from "@/features/orders/orderTypes"
import { useOrderSuggestedPackaging } from "@/features/packaging/useOrderSuggestedPackaging"

import { OrderFulfillmentActionBar } from "./OrderFulfillmentActionBar"
import { OrderSuggestedPackagingWidget } from "./OrderSuggestedPackagingWidget"

export function OrderFulfillmentSection(props: {
  order: OrderDetail
  onDidMutate: () => void
}): ReactNode {
  const { order, onDidMutate } = props
  const [confirmedPackagingTypeId, setConfirmedPackagingTypeId] = useState<string | null>(null)
  const handleConfirmedPackagingChange = useCallback((packagingTypeId: string | null): void => {
    setConfirmedPackagingTypeId(packagingTypeId)
  }, [])

  const packagingModel = useOrderSuggestedPackaging({
    lineItems: order.lineItems,
    onConfirmedPackagingChange: handleConfirmedPackagingChange,
  })

  return (
    <section
      aria-label="Order fulfillment"
      className="space-y-4"
      data-confirmed-packaging-type-id={confirmedPackagingTypeId ?? undefined}
    >
      <OrderSuggestedPackagingWidget model={packagingModel} />
      <OrderFulfillmentActionBar
        order={order}
        confirmedPackagingTypeId={confirmedPackagingTypeId}
        shipmondoLabelBlockReason={packagingModel.shipmondoLabelBlockReason}
        onDidMutate={onDidMutate}
      />
    </section>
  )
}
