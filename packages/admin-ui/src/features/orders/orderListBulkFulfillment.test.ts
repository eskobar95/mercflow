import { describe, expect, it } from "vitest"

import { orderListRowEligibleForBulkFulfillment } from "@/features/orders/orderListBulkFulfillment"
import type { OrderListRow } from "@/features/orders/orderTypes"

function row(overrides: Partial<OrderListRow>): OrderListRow {
  return {
    id: "ord_1",
    displayId: "1",
    orderStatus: "pending",
    customerName: "A",
    customerEmail: "a@example.com",
    createdAt: "2026-06-04T10:00:00.000Z",
    paymentStatus: "captured",
    fulfillmentStatus: "not_fulfilled",
    totalMinor: 1000,
    currencyCode: "dkk",
    ...overrides,
  }
}

describe("orderListRowEligibleForBulkFulfillment", () => {
  it("allows paid orders awaiting fulfillment", () => {
    expect(orderListRowEligibleForBulkFulfillment(row({}))).toBe(true)
  })

  it("rejects unpaid orders", () => {
    expect(
      orderListRowEligibleForBulkFulfillment(row({ paymentStatus: "not_paid" }))
    ).toBe(false)
  })
})
