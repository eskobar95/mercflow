import type { SubscriberArgs } from "@medusajs/framework"
import type { FulfillmentDTO } from "@medusajs/framework/types"
import type { OrderDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { formatOrderMoney } from "@mercflow/notification-module/templates"

type OrderWithStoreId = OrderDTO & {
  store_id?: string | null
}

const CANCELLATION_REASON_KEYS = [
  "cancellation_reason",
  "cancel_reason",
  "cancellationReason",
] as const

const EXPECTED_DELIVERY_KEYS = [
  "expected_delivery",
  "expectedDelivery",
  "delivery_window",
] as const

export async function resolveOrderIdFromFulfillment(
  container: SubscriberArgs["container"],
  fulfillmentId: string
): Promise<string | null> {
  try {
    const remoteQuery = container.resolve(ContainerRegistrationKeys.REMOTE_QUERY) as {
      graph: (input: {
        entity: string
        fields: string[]
        filters?: Record<string, unknown>
      }) => Promise<{ data: unknown[] }>
    }

    const result = await remoteQuery.graph({
      entity: "order",
      fields: ["id"],
      filters: {
        fulfillments: {
          id: fulfillmentId,
        },
      },
    })

    const orders = Array.isArray(result.data) ? result.data : []
    const first = orders[0] as { id?: string } | undefined
    return typeof first?.id === "string" ? first.id : null
  } catch {
    return null
  }
}

export async function retrieveFulfillmentForNotification(
  container: SubscriberArgs["container"],
  fulfillmentId: string
): Promise<FulfillmentDTO | null> {
  try {
    const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
    return (await fulfillmentModule.retrieveFulfillment(fulfillmentId, {
      relations: ["labels", "provider"],
    })) as FulfillmentDTO
  } catch {
    return null
  }
}

export function resolveCarrierName(fulfillment: FulfillmentDTO): string | null {
  const providerName = fulfillment.provider?.name?.trim()
  if (providerName !== undefined && providerName.length > 0) {
    return providerName
  }

  const providerId = fulfillment.provider_id?.trim()
  return providerId !== undefined && providerId.length > 0 ? providerId : null
}

export function resolvePrimaryTrackingLabel(
  fulfillment: FulfillmentDTO
): { trackingNumber: string | null; trackingUrl: string | null } {
  const label = fulfillment.labels?.[0]
  if (label === undefined) {
    return { trackingNumber: null, trackingUrl: null }
  }

  const trackingNumber = label.tracking_number?.trim()
  const trackingUrl = label.tracking_url?.trim()

  return {
    trackingNumber: trackingNumber && trackingNumber.length > 0 ? trackingNumber : null,
    trackingUrl: trackingUrl && trackingUrl.length > 0 ? trackingUrl : null,
  }
}

function readMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  keys: readonly string[]
): string | null {
  if (metadata === null || metadata === undefined) {
    return null
  }

  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }

  return null
}

export function resolveExpectedDelivery(fulfillment: FulfillmentDTO): string | null {
  const fromMetadata = readMetadataString(fulfillment.metadata, EXPECTED_DELIVERY_KEYS)
  if (fromMetadata !== null) {
    return fromMetadata
  }

  return readMetadataString(fulfillment.data, EXPECTED_DELIVERY_KEYS)
}

export function resolveCancellationReason(order: OrderWithStoreId): string | null {
  return readMetadataString(order.metadata, CANCELLATION_REASON_KEYS)
}

export function resolveRefundNote(order: OrderWithStoreId): string | null {
  const refundedTotal = order.summary?.refunded_total
  const refunded =
    typeof refundedTotal === "number"
      ? refundedTotal
      : refundedTotal !== undefined
        ? Number(refundedTotal)
        : 0

  if (Number.isFinite(refunded) && refunded > 0) {
    return `A refund of ${formatOrderMoney(refundedTotal, order.currency_code)} has been initiated and may take several business days to appear.`
  }

  return "If you were charged, any applicable refund will be processed according to your payment method's timeline."
}

export async function retrieveCustomerForNotification(
  container: SubscriberArgs["container"],
  customerId: string
): Promise<{ email: string | null; firstName: string | null } | null> {
  try {
    const customerModule = container.resolve(Modules.CUSTOMER)
    const customer = (await customerModule.retrieveCustomer(customerId, {
      select: ["email", "first_name"],
    })) as { email?: string | null; first_name?: string | null }

    const email = customer.email?.trim()
    const firstName = customer.first_name?.trim()

    return {
      email: email && email.length > 0 ? email : null,
      firstName: firstName && firstName.length > 0 ? firstName : null,
    }
  } catch {
    return null
  }
}
