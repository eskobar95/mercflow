import { describe, expect, it } from "vitest"

import { buildPickListFromOrders } from "./pick-list"

describe("buildPickListFromOrders", () => {
  it("includes paid orders with open fulfillment on the pick day", () => {
    const day = "2026-06-04"
    const orders = buildPickListFromOrders(
      [
        {
          id: "ord_1",
          display_id: 42,
          payment_status: "captured",
          created_at: `${day}T08:00:00.000Z`,
          items: [
            {
              id: "li_1",
              title: "Widget",
              variant_title: "Blue",
              quantity: 2,
              fulfilled_quantity: 0,
            },
          ],
          fulfillments: [
            {
              id: "ful_1",
              created_at: `${day}T09:00:00.000Z`,
              shipped_at: null,
              canceled_at: null,
              shipments: [],
            },
          ],
          shipping_address: { first_name: "Ada", last_name: "L", city: "København" },
        },
      ],
      day
    )
    expect(orders).toHaveLength(1)
    expect(orders[0]?.display_id).toBe("42")
    expect(orders[0]?.lines[0]?.quantity).toBe(2)
  })

  it("excludes unpaid orders", () => {
    const day = "2026-06-04"
    const orders = buildPickListFromOrders(
      [
        {
          id: "ord_2",
          display_id: 43,
          payment_status: "not_paid",
          created_at: `${day}T08:00:00.000Z`,
          items: [{ id: "li_1", title: "X", quantity: 1 }],
          fulfillments: [{ id: "ful_1", created_at: `${day}T09:00:00.000Z` }],
        },
      ],
      day
    )
    expect(orders).toHaveLength(0)
  })
})
