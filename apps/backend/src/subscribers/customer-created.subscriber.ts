import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { NOTIFICATION_MODULE } from "@mercflow/notification-module"
import { CUSTOMER_WELCOME_TEMPLATE_KEY } from "@mercflow/notification-module/templates"

import { retrieveCustomerForNotification } from "./notification-subscriber-utils"
import { resolveDefaultStoreId } from "./mercflow-seo-subscriber-utils"

type NotificationEnqueueService = {
  enqueueEmail: (input: {
    storeId: string
    templateKey: string
    to: string
    entityId: string
    data: Record<string, unknown>
  }) => Promise<unknown>
}

export default async function customerCreatedSubscriber({
  event,
  container,
}: SubscriberArgs<{ id: string }>): Promise<void> {
  const customerId = event.data.id
  const customer = await retrieveCustomerForNotification(container, customerId)
  if (customer === null || customer.email === null) {
    return
  }

  const storeId = await resolveDefaultStoreId(container)
  if (storeId === null) {
    return
  }

  const notificationService = container.resolve(
    NOTIFICATION_MODULE
  ) as unknown as NotificationEnqueueService

  await notificationService.enqueueEmail({
    storeId,
    templateKey: CUSTOMER_WELCOME_TEMPLATE_KEY,
    to: customer.email,
    entityId: customerId,
    data: {
      customerFirstName: customer.firstName,
    },
  })
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
