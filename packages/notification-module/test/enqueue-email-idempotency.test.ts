import { describe, expect, it, vi } from "vitest"

import NotificationModuleService from "../src/modules/notification/service"
import type { NotificationQueueClient } from "../src/modules/notification/queue-client"
import { buildEmailJobId } from "../src/modules/notification/queue-client"
import type { EmailDeliveryRecord } from "../src/modules/notification/types"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"

function buildDelivery(overrides?: Partial<EmailDeliveryRecord>): EmailDeliveryRecord {
  return {
    id: "edel_01ABC",
    store_id: STORE_A,
    template_key: "order-confirmation",
    to_email: "buyer@example.com",
    entity_id: "order_01XYZ",
    idempotency_key: buildEmailJobId(STORE_A, "order-confirmation", "order_01XYZ"),
    status: "queued",
    error_message: null,
    sent_at: null,
    ses_message_id: null,
    created_at: new Date("2026-06-11T12:00:00.000Z"),
    updated_at: new Date("2026-06-11T12:00:00.000Z"),
    deleted_at: null,
    ...overrides,
  }
}

describe("NotificationModuleService.enqueueEmail idempotency", (): void => {
  it("skips BullMQ enqueue when the job already exists", async (): Promise<void> => {
    const delivery = buildDelivery()
    const jobId = delivery.idempotency_key

    const queueClient: NotificationQueueClient = {
      getJob: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: jobId }),
      addSendEmailJob: vi.fn().mockResolvedValue(undefined),
    }

    vi.spyOn(
      NotificationModuleService.prototype as unknown as {
        listMercflowEmailDeliveries: () => Promise<unknown[]>
      },
      "listMercflowEmailDeliveries"
    )
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([delivery])

    vi.spyOn(
      NotificationModuleService.prototype as unknown as {
        createMercflowEmailDeliveries: () => Promise<unknown>
      },
      "createMercflowEmailDeliveries"
    ).mockResolvedValue(delivery)

    const svc = Object.create(NotificationModuleService.prototype) as NotificationModuleService
    svc.setQueueClient(queueClient)
    vi.spyOn(svc, "withTenant").mockImplementation(async (_storeId, fn) =>
      fn({ transactionManager: {} })
    )

    const first = await svc.enqueueEmail({
      storeId: STORE_A,
      templateKey: "order-confirmation",
      to: "buyer@example.com",
      entityId: "order_01XYZ",
      data: { orderId: "order_01XYZ" },
    })

    const second = await svc.enqueueEmail({
      storeId: STORE_A,
      templateKey: "order-confirmation",
      to: "buyer@example.com",
      entityId: "order_01XYZ",
      data: { orderId: "order_01XYZ" },
    })

    expect(first.enqueued).toBe(true)
    expect(second.enqueued).toBe(false)
    expect(second.delivery.id).toBe(delivery.id)
    expect(queueClient.addSendEmailJob).toHaveBeenCalledTimes(1)
  })
})
