import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { NOTIFICATION_MODULE } from "@mercflow/notification-module"
import { SHIPPING_UPDATE_TEMPLATE_KEY } from "@mercflow/notification-module/templates"

import {
  resolveCarrierName,
  resolveExpectedDelivery,
  resolveOrderIdFromFulfillment,
  resolvePrimaryTrackingLabel,
  retrieveFulfillmentForNotification,
} from "./notification-subscriber-utils"
import {
  resolveOrderRecipientEmail,
  resolveOrderStoreId,
  retrieveOrderForNotification,
} from "./order-subscriber-utils"

type NotificationEnqueueService = {
  enqueueEmail: (input: {
    storeId: string
    templateKey: string
    to: string
    entityId: string
    data: Record<string, unknown>
  }) => Promise<unknown>
}

type ShipmentCreatedEventData = {
  id: string
  no_notification?: boolean
}

export default async function orderShippedSubscriber({
  event,
  container,
}: SubscriberArgs<ShipmentCreatedEventData>): Promise<void> {
  if (event.data.no_notification === true) {
    return
  }

  const fulfillmentId = event.data.id
  const fulfillment = await retrieveFulfillmentForNotification(container, fulfillmentId)
  if (fulfillment === null) {
    return
  }

  const orderId = await resolveOrderIdFromFulfillment(container, fulfillmentId)
  if (orderId === null) {
    return
  }

  const order = await retrieveOrderForNotification(container, orderId)
  if (order === null) {
    return
  }

  const storeId = await resolveOrderStoreId(container, order)
  if (storeId === null) {
    return
  }

  const recipientEmail = await resolveOrderRecipientEmail(container, order)
  if (recipientEmail === null) {
    return
  }

  const { trackingNumber, trackingUrl } = resolvePrimaryTrackingLabel(fulfillment)
  const notificationService = container.resolve(
    NOTIFICATION_MODULE
  ) as unknown as NotificationEnqueueService

  await notificationService.enqueueEmail({
    storeId,
    templateKey: SHIPPING_UPDATE_TEMPLATE_KEY,
    to: recipientEmail,
    entityId: fulfillmentId,
    data: {
      order,
      carrierName: resolveCarrierName(fulfillment),
      trackingNumber,
      trackingUrl,
      expectedDelivery: resolveExpectedDelivery(fulfillment),
    },
  })
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
