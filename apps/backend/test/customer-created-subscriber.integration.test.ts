import type { SubscriberArgs } from "@medusajs/framework"
import { describe, expect, it, vi } from "vitest"

import { NOTIFICATION_MODULE } from "@mercflow/notification-module"
import { CUSTOMER_WELCOME_TEMPLATE_KEY } from "@mercflow/notification-module/templates"

import customerCreatedSubscriber from "../src/subscribers/customer-created.subscriber"

const STORE_ID = "store_01KG0VBTT0714XV2CCTEBRVC47"
const CUSTOMER_ID = "cus_01ABC"
const IDEMPOTENCY_KEY = `${STORE_ID}:${CUSTOMER_WELCOME_TEMPLATE_KEY}:${CUSTOMER_ID}`

describe("customer.created subscriber integration", (): void => {
  it("enqueues customer welcome email with queued delivery metadata", async (): Promise<void> => {
    const enqueueEmail = vi.fn().mockResolvedValue({
      delivery: {
        id: "edel_01ABC",
        store_id: STORE_ID,
        template_key: CUSTOMER_WELCOME_TEMPLATE_KEY,
        to_email: "jane@example.com",
        entity_id: CUSTOMER_ID,
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

    const customerModule = {
      retrieveCustomer: vi.fn().mockResolvedValue({
        email: "jane@example.com",
        first_name: "Jane",
      }),
    }

    const storeModule = {
      listStores: vi.fn().mockResolvedValue([{ id: STORE_ID }]),
    }

    const container = {
      resolve: vi.fn((key: string) => {
        if (key === "customer") {
          return customerModule
        }
        if (key === "store") {
          return storeModule
        }
        if (key === NOTIFICATION_MODULE) {
          return { enqueueEmail }
        }
        throw new Error(`Unexpected resolve key: ${key}`)
      }),
    }

    await customerCreatedSubscriber({
      event: { name: "customer.created", data: { id: CUSTOMER_ID } },
      container: container as unknown as SubscriberArgs["container"],
    } as SubscriberArgs<{ id: string }>)

    expect(enqueueEmail).toHaveBeenCalledWith({
      storeId: STORE_ID,
      templateKey: CUSTOMER_WELCOME_TEMPLATE_KEY,
      to: "jane@example.com",
      entityId: CUSTOMER_ID,
      data: {
        customerFirstName: "Jane",
      },
    })

    const result = await enqueueEmail.mock.results[0]?.value
    expect(result.delivery.status).toBe("queued")
    expect(result.delivery.idempotency_key).toBe(IDEMPOTENCY_KEY)
  })

  it("skips enqueue when customer has no email", async (): Promise<void> => {
    const enqueueEmail = vi.fn()

    const customerModule = {
      retrieveCustomer: vi.fn().mockResolvedValue({
        email: null,
        first_name: "Jane",
      }),
    }

    const container = {
      resolve: vi.fn((key: string) => {
        if (key === "customer") {
          return customerModule
        }
        if (key === NOTIFICATION_MODULE) {
          return { enqueueEmail }
        }
        throw new Error(`Unexpected resolve key: ${key}`)
      }),
    }

    await customerCreatedSubscriber({
      event: { name: "customer.created", data: { id: CUSTOMER_ID } },
      container: container as unknown as SubscriberArgs["container"],
    } as SubscriberArgs<{ id: string }>)

    expect(enqueueEmail).not.toHaveBeenCalled()
  })
})
