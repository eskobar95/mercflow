import { type ReactNode, useMemo } from "react"

import { getOrderFulfillmentActionVisibility } from "@/features/orders/orderFulfillmentActionState"
import type { OrderDetail } from "@/features/orders/orderTypes"
import { useOrderSuggestedPackaging } from "@/features/packaging/useOrderSuggestedPackaging"

import { OrderFulfillmentActionBar } from "./OrderFulfillmentActionBar"
import { OrderSuggestedPackagingWidget } from "./OrderSuggestedPackagingWidget"

export function OrderFulfillmentSection(props: {
  order: OrderDetail
  onDidMutate: () => void
}): ReactNode {
  const { order, onDidMutate } = props
  const visibility = useMemo(() => getOrderFulfillmentActionVisibility(order), [order])
  const fulfillmentId = visibility.labelFulfillmentId

  const packagingModel = useOrderSuggestedPackaging({
    lineItems: order.lineItems,
    fulfillmentId,
  })

  return (
    <section
      aria-label="Order fulfillment"
      className="space-y-4"
      data-confirmed-packaging-type-id={packagingModel.confirmedPackagingId ?? undefined}
    >
      <OrderSuggestedPackagingWidget model={packagingModel} />
      <OrderFulfillmentActionBar
        order={order}
        confirmedPackagingTypeId={packagingModel.confirmedPackagingId}
        shipmondoLabelBlockReason={packagingModel.shipmondoLabelBlockReason}
        onDidMutate={onDidMutate}
      />
    </section>
  )
}
