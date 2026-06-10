import { type ReactNode, useCallback, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { Card } from "@/components/ui/Card"
import { MainLoadingFallback } from "@/components/ui/MainLoadingFallback"
import { OrderCustomerCard } from "@/components/orders/OrderCustomerCard"
import { OrderLineItemsTable } from "@/components/orders/OrderLineItemsTable"
import { OrderPaymentSummaryCard } from "@/components/orders/OrderPaymentSummaryCard"
import { OrderAdminBadge } from "@/components/orders/OrderAdminBadge"
import { OrderShippingAddressCard } from "@/components/orders/OrderShippingAddressCard"
import { OrderFulfillmentActionBar } from "@/components/orders/OrderFulfillmentActionBar"
import { OrderSuggestedPackagingWidget } from "@/components/orders/OrderSuggestedPackagingWidget"
import { OrderInternalNotesPanel } from "@/components/orders/OrderInternalNotesPanel"
import { OrderStatusTimeline } from "@/components/orders/OrderStatusTimeline"
import { useOrderDetail } from "@/hooks/useOrderDetail"
import { formatAdminCurrency } from "@/utils/formatAdminCurrency"
import { buildOrderTimeline } from "@/utils/buildOrderTimeline"

export function OrderDetailPage(): ReactNode {
  const { orderId } = useParams<{ orderId: string }>()
  const { order, isLoading, errorMessage, refetch } = useOrderDetail(orderId)
  const [confirmedPackagingTypeId, setConfirmedPackagingTypeId] = useState<string | null>(null)
  const handleConfirmedPackagingChange = useCallback((packagingTypeId: string | null): void => {
    setConfirmedPackagingTypeId(packagingTypeId)
  }, [])

  if (isLoading && order === null && errorMessage === null) {
    return (
      <div className="p-6">
        <MainLoadingFallback />
      </div>
    )
  }

  if (errorMessage !== null && order === null) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-border-default bg-surface-default px-6 py-8 shadow-sm">
          <p className="text-sm text-content-danger" role="alert">
            {errorMessage}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-border-default bg-surface-raised px-3 py-1.5 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              onClick={() => {
                refetch()
              }}
            >
              Retry
            </button>
            <Link
              to="/orders"
              className="rounded-md bg-interactive-primary px-3 py-1.5 text-sm font-medium text-content-inverse focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            >
              Back to orders
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (order === null) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">Order not available.</p>
      </div>
    )
  }

  const timeline = buildOrderTimeline(order)

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          to="/orders"
          className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          ← Orders
        </Link>
      </div>

      <header className="mb-6 flex flex-col gap-3 border-b border-border-subtle pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-content-primary">
            Order #{order.displayId}
          </h1>
          <time
            className="mt-1 block text-sm text-content-secondary"
            dateTime={order.createdAt}
          >
            Placed{" "}
            {new Date(order.createdAt).toLocaleString("da-DK", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-content-tertiary">Workflow</p>
              <div className="mt-1">
                <OrderAdminBadge value={order.status} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-content-tertiary">Payment</p>
              <div className="mt-1">
                <OrderAdminBadge value={order.paymentStatus} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-content-tertiary">Fulfillment</p>
              <div className="mt-1">
                <OrderAdminBadge value={order.fulfillmentStatus} />
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-content-tertiary">
            Total
          </p>
          <p className="text-2xl font-semibold tabular-nums text-content-primary">
            {formatAdminCurrency(order.totalMinor, order.currencyCode)}
          </p>
        </div>
      </header>

      <section
        aria-label="Order fulfillment"
        className="mb-6 space-y-4"
        data-confirmed-packaging-type-id={confirmedPackagingTypeId ?? undefined}
      >
        <OrderSuggestedPackagingWidget
          lineItems={order.lineItems}
          onConfirmedPackagingChange={handleConfirmedPackagingChange}
        />
        <OrderFulfillmentActionBar
          order={order}
          confirmedPackagingTypeId={confirmedPackagingTypeId}
          onDidMutate={refetch}
        />
      </section>

      <div className="mb-6">
        <OrderInternalNotesPanel orderId={order.id} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-content-primary">Line items</h2>
            <OrderLineItemsTable items={order.lineItems} currencyCode={order.currencyCode} />
          </section>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <OrderCustomerCard detail={order} />
            <OrderShippingAddressCard address={order.shippingAddress} />
          </div>
        </div>
        <div className="space-y-6">
          <OrderPaymentSummaryCard
            currencyCode={order.currencyCode}
            paymentStatus={order.paymentStatus}
            totalMinor={order.totalMinor}
          />
          <Card>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
              Status timeline
            </h2>
            <div className="mt-4">
              <OrderStatusTimeline steps={timeline} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
