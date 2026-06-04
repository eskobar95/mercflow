import { describe, expect, it } from "vitest"

import { parseOrderDetailPayload } from "@/features/orders/orderJson"
import { getOrderFulfillmentActionVisibility } from "@/features/orders/orderFulfillmentActionState"

const baseOrderPayload = {
  id: "ord_action",
  display_id: 2001,
  status: "pending",
  email: "buyer@example.com",
  currency_code: "dkk",
  items: [
    {
      id: "oli_1",
      title: "Widget",
      variant_title: "",
      quantity: 1,
      unit_price: 1000,
      total: 1000,
    },
  ],
  fulfillments: [] as Record<string, unknown>[],
  summary: {},
  created_at: "2026-05-10T10:00:00.000Z",
  updated_at: "2026-05-10T10:00:00.000Z",
  total: 1000,
}

function visibilityFrom(payload: Record<string, unknown>): ReturnType<
  typeof getOrderFulfillmentActionVisibility
> {
  const detail = parseOrderDetailPayload({ order: payload })
  if (detail === null) {
    throw new Error("fixture order failed to parse")
  }
  return getOrderFulfillmentActionVisibility(detail)
}

describe("getOrderFulfillmentActionVisibility", () => {
  it("shows Capture payment while aggregate or payment rows are awaiting capture", () => {
    const v = visibilityFrom({
      ...baseOrderPayload,
      payment_status: "awaiting",
      fulfillment_status: "not_fulfilled",
      payment_collections: [
        {
          payments: [
            {
              id: "pay_await",
              status: "awaiting",
              captured_at: null,
            },
          ],
        },
      ],
    })
    expect(v.showCapturePayment).toBe(true)
    expect(v.capturablePaymentId).toBe("pay_await")
    expect(v.showCreateFulfillment).toBe(false)
    expect(v.showMarkShipped).toBe(false)
  })

  it("shows Create fulfillment after payment is captured and no active unshipped fulfillment", () => {
    const v = visibilityFrom({
      ...baseOrderPayload,
      payment_status: "captured",
      fulfillment_status: "not_fulfilled",
      payment_collections: [
        {
          payments: [
            {
              id: "pay_cap",
              status: "captured",
              captured_at: "2026-05-10T10:05:00.000Z",
            },
          ],
        },
      ],
    })
    expect(v.showCapturePayment).toBe(false)
    expect(v.showCreateFulfillment).toBe(true)
    expect(v.fulfillmentItemsPayload).toEqual([{ id: "oli_1", quantity: 1 }])
    expect(v.showMarkShipped).toBe(false)
  })

  it("shows Mark as shipped when a fulfillment exists without shipped_at", () => {
    const v = visibilityFrom({
      ...baseOrderPayload,
      payment_status: "captured",
      fulfillment_status: "not_fulfilled",
      fulfillments: [
        {
          id: "ful_1",
          created_at: "2026-05-10T11:00:00.000Z",
        },
      ],
      payment_collections: [
        {
          payments: [{ id: "pay_cap", status: "captured", captured_at: "2026-05-10T10:05:00.000Z" }],
        },
      ],
    })
    expect(v.showCreateFulfillment).toBe(false)
    expect(v.showMarkShipped).toBe(true)
    expect(v.unshippedFulfillmentId).toBe("ful_1")
    expect(v.shipmentItemsPayload).toEqual([])
  })

  it("builds shipmentItemsPayload from fulfillment line rows (id or line_item_id)", () => {
    const v = visibilityFrom({
      ...baseOrderPayload,
      payment_status: "captured",
      fulfillment_status: "not_fulfilled",
      fulfillments: [
        {
          id: "ful_1",
          created_at: "2026-05-10T11:00:00.000Z",
          items: [
            { id: "fli_1", quantity: 1 },
            { line_item_id: "oli_1", quantity: 1 },
          ],
        },
      ],
      payment_collections: [
        {
          payments: [{ id: "pay_cap", status: "captured", captured_at: "2026-05-10T10:05:00.000Z" }],
        },
      ],
    })
    expect(v.showMarkShipped).toBe(true)
    expect(v.shipmentItemsPayload).toEqual([
      { id: "fli_1", quantity: 1 },
      { id: "oli_1", quantity: 1 },
    ])
  })

  it("skips canceled fulfillments and prefers the first open unshipped fulfillment", () => {
    const v = visibilityFrom({
      ...baseOrderPayload,
      payment_status: "captured",
      fulfillment_status: "not_fulfilled",
      fulfillments: [
        {
          id: "ful_cancel",
          canceled_at: "2026-05-10T10:00:00.000Z",
          created_at: "2026-05-10T09:00:00.000Z",
        },
        {
          id: "ful_open",
          created_at: "2026-05-10T11:00:00.000Z",
        },
      ],
      payment_collections: [
        {
          payments: [{ id: "pay_cap", status: "captured", captured_at: "2026-05-10T10:05:00.000Z" }],
        },
      ],
    })
    expect(v.unshippedFulfillmentId).toBe("ful_open")
  })

  it("hides Mark as shipped when fulfillment already has shipment records", () => {
    const v = visibilityFrom({
      ...baseOrderPayload,
      payment_status: "captured",
      fulfillment_status: "shipped",
      fulfillments: [
        {
          id: "ful_1",
          created_at: "2026-05-10T11:00:00.000Z",
          shipments: [{ id: "ship_1" }],
        },
      ],
      payment_collections: [
        {
          payments: [{ id: "pay_cap", status: "captured", captured_at: "2026-05-10T10:05:00.000Z" }],
        },
      ],
    })
    expect(v.showMarkShipped).toBe(false)
  })

  it("hides fulfillment actions once the open fulfillment is shipped", () => {
    const v = visibilityFrom({
      ...baseOrderPayload,
      payment_status: "captured",
      fulfillment_status: "shipped",
      items: [
        {
          id: "oli_1",
          title: "Widget",
          quantity: 1,
          fulfilled_quantity: 1,
          unit_price: 1000,
          total: 1000,
        },
      ],
      fulfillments: [
        {
          id: "ful_1",
          created_at: "2026-05-10T11:00:00.000Z",
          shipped_at: "2026-05-10T12:00:00.000Z",
        },
      ],
      payment_collections: [
        {
          payments: [{ id: "pay_cap", status: "captured", captured_at: "2026-05-10T10:05:00.000Z" }],
        },
      ],
    })
    expect(v.showMarkShipped).toBe(false)
    expect(v.showCreateFulfillment).toBe(false)
    expect(v.fulfillmentItemsPayload).toEqual([])
  })
})
