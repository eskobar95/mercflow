import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { NOTIFICATION_MODULE } from "@mercflow/notification-module"
import { ORDER_CANCELLATION_TEMPLATE_KEY } from "@mercflow/notification-module/templates"

import {
  resolveCancellationReason,
  resolveRefundNote,
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

export default async function orderCanceledSubscriber({
  event,
  container,
}: SubscriberArgs<{ id: string }>): Promise<void> {
  const orderId = event.data.id
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

  const notificationService = container.resolve(
    NOTIFICATION_MODULE
  ) as unknown as NotificationEnqueueService

  await notificationService.enqueueEmail({
    storeId,
    templateKey: ORDER_CANCELLATION_TEMPLATE_KEY,
    to: recipientEmail,
    entityId: order.id,
    data: {
      order,
      cancellationReason: resolveCancellationReason(order),
      refundNote: resolveRefundNote(order),
    },
  })
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
