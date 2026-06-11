import type { SubscriberArgs } from "@medusajs/framework"
import type { OrderDTO } from "@medusajs/framework/types"
import { describe, expect, it, vi } from "vitest"

import { NOTIFICATION_MODULE } from "@mercflow/notification-module"
import { ORDER_CONFIRMATION_TEMPLATE_KEY } from "@mercflow/notification-module/templates"

import orderPlacedSubscriber from "../src/subscribers/order-placed.subscriber"

const STORE_ID = "store_01KG0VBTT0714XV2CCTEBRVC47"
const ORDER_ID = "order_01XYZ"
const IDEMPOTENCY_KEY = `${STORE_ID}:${ORDER_CONFIRMATION_TEMPLATE_KEY}:${ORDER_ID}`

function buildOrder(overrides?: Partial<OrderDTO & { store_id?: string }>): OrderDTO & {
  store_id?: string
} {
  return {
    id: ORDER_ID,
    version: 1,
    display_id: 1001,
    status: "pending",
    currency_code: "usd",
    email: "buyer@example.com",
    store_id: STORE_ID,
    created_at: "2026-06-11T12:00:00.000Z",
    updated_at: "2026-06-11T12:00:00.000Z",
    original_item_total: 5000,
    original_item_subtotal: 5000,
    original_item_tax_total: 0,
    item_total: 5000,
    item_subtotal: 5000,
    item_tax_total: 0,
    original_total: 5000,
    original_subtotal: 5000,
    original_tax_total: 0,
    total: 5000,
    subtotal: 5000,
    tax_total: 0,
    discount_total: 0,
    discount_tax_total: 0,
    shipping_total: 0,
    shipping_subtotal: 0,
    shipping_tax_total: 0,
    items: [],
    ...overrides,
  } as OrderDTO & { store_id?: string }
}

describe("order.placed subscriber integration", (): void => {
  it("enqueues order confirmation email with queued delivery metadata", async (): Promise<void> => {
    const order = buildOrder()
    const enqueueEmail = vi.fn().mockResolvedValue({
      delivery: {
        id: "edel_01ABC",
        store_id: STORE_ID,
        template_key: ORDER_CONFIRMATION_TEMPLATE_KEY,
        to_email: "buyer@example.com",
        entity_id: ORDER_ID,
        idempotency_key: IDEMPOTENCY_KEY,
        status: "queued",
        error_message: null,
        sent_at: null,
        ses_message_id: null,
        created_at: new Date("2026-06-11T12:00:00.000Z"),
        updated_at: new Date("2026-06-11T12:00:00.000Z"),
        deleted_at: null,
      },
      enqueued: true,
    })

    const orderModule = {
      retrieveOrder: vi.fn().mockResolvedValue(order),
    }

    const container = {
      resolve: vi.fn((key: string) => {
        if (key === "order") {
          return orderModule
        }
        if (key === NOTIFICATION_MODULE) {
          return { enqueueEmail }
        }
        throw new Error(`Unexpected resolve key: ${key}`)
      }),
    }

    await orderPlacedSubscriber({
      event: { name: "order.placed", data: { id: ORDER_ID } },
      container: container as unknown as SubscriberArgs["container"],
    } as SubscriberArgs<{ id: string }>)

    expect(enqueueEmail).toHaveBeenCalledWith({
      storeId: STORE_ID,
      templateKey: ORDER_CONFIRMATION_TEMPLATE_KEY,
      to: "buyer@example.com",
      entityId: ORDER_ID,
      data: { order },
    })

    const result = await enqueueEmail.mock.results[0]?.value
    expect(result.delivery.status).toBe("queued")
    expect(result.delivery.idempotency_key).toBe(IDEMPOTENCY_KEY)
  })

  it("skips enqueue when order has no recipient email", async (): Promise<void> => {
    const order = buildOrder({ email: undefined, customer_id: undefined })
    const enqueueEmail = vi.fn()

    const orderModule = {
      retrieveOrder: vi.fn().mockResolvedValue(order),
    }

    const container = {
      resolve: vi.fn((key: string) => {
        if (key === "order") {
          return orderModule
        }
        if (key === NOTIFICATION_MODULE) {
          return { enqueueEmail }
        }
        throw new Error(`Unexpected resolve key: ${key}`)
      }),
    }

    await orderPlacedSubscriber({
      event: { name: "order.placed", data: { id: ORDER_ID } },
      container: container as unknown as SubscriberArgs["container"],
    } as SubscriberArgs<{ id: string }>)

    expect(enqueueEmail).not.toHaveBeenCalled()
  })
})
