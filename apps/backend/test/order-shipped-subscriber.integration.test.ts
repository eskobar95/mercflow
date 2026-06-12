import type { SubscriberArgs } from "@medusajs/framework"
import type { FulfillmentDTO, OrderDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { describe, expect, it, vi } from "vitest"

import { NOTIFICATION_MODULE } from "@mercflow/notification-module"
import { SHIPPING_UPDATE_TEMPLATE_KEY } from "@mercflow/notification-module/templates"

import orderShippedSubscriber from "../src/subscribers/order-shipped.subscriber"

const STORE_ID = "store_01KG0VBTT0714XV2CCTEBRVC47"
const ORDER_ID = "order_01XYZ"
const FULFILLMENT_ID = "ful_01ABC"
const IDEMPOTENCY_KEY = `${STORE_ID}:${SHIPPING_UPDATE_TEMPLATE_KEY}:${FULFILLMENT_ID}`

function buildOrder(): OrderDTO & { store_id?: string } {
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
  } as unknown as OrderDTO & { store_id?: string }
}

function buildFulfillment(): FulfillmentDTO {
  return {
    id: FULFILLMENT_ID,
    location_id: "loc_01ABC",
    packed_at: null,
    shipped_at: new Date("2026-06-11T12:00:00.000Z"),
    delivered_at: null,
    canceled_at: null,
    data: { expected_delivery: "June 14–16, 2026" },
    provider_id: "manual_manual",
    shipping_option_id: null,
    metadata: null,
    shipping_option: null,
    requires_shipping: true,
    provider: {
      id: "manual_manual",
      name: "Manual",
      metadata: null,
      shipping_options: [],
      created_at: new Date("2026-06-11T12:00:00.000Z"),
      updated_at: new Date("2026-06-11T12:00:00.000Z"),
      deleted_at: null,
    },
    delivery_address: {
      id: "addr_01ABC",
      fulfillment_id: FULFILLMENT_ID,
      company: null,
      first_name: "Jane",
      last_name: "Doe",
      address_1: "123 Main Street",
      address_2: null,
      city: "Copenhagen",
      country_code: "dk",
      province: null,
      postal_code: "2100",
      phone: null,
      metadata: null,
      created_at: new Date("2026-06-11T12:00:00.000Z"),
      updated_at: new Date("2026-06-11T12:00:00.000Z"),
      deleted_at: null,
    },
    items: [],
    labels: [
      {
        id: "label_01ABC",
        tracking_number: "PN123456789DK",
        tracking_url: "https://tracking.example.com/PN123456789DK",
        label_url: "https://labels.example.com/label.pdf",
        fulfillment_id: FULFILLMENT_ID,
        fulfillment: {} as FulfillmentDTO,
        created_at: new Date("2026-06-11T12:00:00.000Z"),
        updated_at: new Date("2026-06-11T12:00:00.000Z"),
        deleted_at: null,
      },
    ],
    created_at: new Date("2026-06-11T12:00:00.000Z"),
    updated_at: new Date("2026-06-11T12:00:00.000Z"),
    deleted_at: null,
  }
}

describe("shipment.created subscriber integration", (): void => {
  it("enqueues shipping update email with queued delivery metadata", async (): Promise<void> => {
    const order = buildOrder()
    const fulfillment = buildFulfillment()
    const enqueueEmail = vi.fn().mockResolvedValue({
      delivery: {
        id: "edel_01ABC",
        store_id: STORE_ID,
        template_key: SHIPPING_UPDATE_TEMPLATE_KEY,
        to_email: "buyer@example.com",
        entity_id: FULFILLMENT_ID,
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

    const fulfillmentModule = {
      retrieveFulfillment: vi.fn().mockResolvedValue(fulfillment),
    }

    const remoteQuery = {
      graph: vi.fn().mockResolvedValue({ data: [{ id: ORDER_ID }] }),
    }

    const container = {
      resolve: vi.fn((key: string) => {
        if (key === "order") {
          return orderModule
        }
        if (key === "fulfillment") {
          return fulfillmentModule
        }
        if (key === NOTIFICATION_MODULE) {
          return { enqueueEmail }
        }
        if (key === ContainerRegistrationKeys.REMOTE_QUERY) {
          return remoteQuery
        }
        throw new Error(`Unexpected resolve key: ${key}`)
      }),
    }

    await orderShippedSubscriber({
      event: { name: "shipment.created", data: { id: FULFILLMENT_ID } },
      container: container as unknown as SubscriberArgs["container"],
    } as SubscriberArgs<{ id: string; no_notification?: boolean }>)

    expect(enqueueEmail).toHaveBeenCalledWith({
      storeId: STORE_ID,
      templateKey: SHIPPING_UPDATE_TEMPLATE_KEY,
      to: "buyer@example.com",
      entityId: FULFILLMENT_ID,
      data: {
        order,
        carrierName: "Manual",
        trackingNumber: "PN123456789DK",
        trackingUrl: "https://tracking.example.com/PN123456789DK",
        expectedDelivery: "June 14–16, 2026",
      },
    })

    const result = await enqueueEmail.mock.results[0]?.value
    expect(result.delivery.status).toBe("queued")
    expect(result.delivery.idempotency_key).toBe(IDEMPOTENCY_KEY)
  })

  it("skips enqueue when no_notification is true", async (): Promise<void> => {
    const enqueueEmail = vi.fn()

    const container = {
      resolve: vi.fn((key: string) => {
        if (key === NOTIFICATION_MODULE) {
          return { enqueueEmail }
        }
        throw new Error(`Unexpected resolve key: ${key}`)
      }),
    }

    await orderShippedSubscriber({
      event: {
        name: "shipment.created",
        data: { id: FULFILLMENT_ID, no_notification: true },
      },
      container: container as unknown as SubscriberArgs["container"],
    } as SubscriberArgs<{ id: string; no_notification?: boolean }>)

    expect(enqueueEmail).not.toHaveBeenCalled()
  })
})
