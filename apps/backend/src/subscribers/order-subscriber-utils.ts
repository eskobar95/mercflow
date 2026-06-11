import type { SubscriberArgs } from "@medusajs/framework"
import type { OrderDTO } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

import { resolveDefaultStoreId } from "./mercflow-seo-subscriber-utils"

type OrderWithStoreId = OrderDTO & {
  store_id?: string | null
}

type CustomerLike = {
  email?: string | null
}

export async function resolveOrderStoreId(
  container: SubscriberArgs["container"],
  order: OrderWithStoreId
): Promise<string | null> {
  const directStoreId = order.store_id
  if (typeof directStoreId === "string" && directStoreId.length > 0) {
    return directStoreId
  }

  return resolveDefaultStoreId(container)
}

export async function resolveOrderRecipientEmail(
  container: SubscriberArgs["container"],
  order: OrderDTO
): Promise<string | null> {
  if (typeof order.email === "string" && order.email.trim().length > 0) {
    return order.email.trim()
  }

  if (order.customer_id === undefined) {
    return null
  }

  try {
    const customerModule = container.resolve(Modules.CUSTOMER)
    const customer = (await customerModule.retrieveCustomer(order.customer_id, {
      select: ["email"],
    })) as CustomerLike
    const email = customer.email?.trim()
    return email && email.length > 0 ? email : null
  } catch {
    return null
  }
}

export async function retrieveOrderForNotification(
  container: SubscriberArgs["container"],
  orderId: string
): Promise<OrderWithStoreId | null> {
  try {
    const orderModule = container.resolve(Modules.ORDER)
    return (await orderModule.retrieveOrder(orderId, {
      relations: ["items", "shipping_address", "summary"],
    })) as OrderWithStoreId
  } catch {
    return null
  }
}
