import { describe, expect, it } from "vitest"

import { orderMatchesPaymentBucket } from "@/features/orders/orderPaymentFilter"
import type { OrderListRow } from "@/features/orders/orderTypes"

function row(paymentStatus: string): OrderListRow {
  return {
    id: "ord_1",
    displayId: "1",
    orderStatus: "pending",
    customerName: "A",
    customerEmail: "a@example.com",
    createdAt: "2026-06-04T10:00:00.000Z",
    paymentStatus,
    fulfillmentStatus: "not_fulfilled",
    totalMinor: 1000,
    currencyCode: "dkk",
  }
}

describe("orderMatchesPaymentBucket", () => {
  it("filters captured payments", () => {
    expect(orderMatchesPaymentBucket(row("captured"), "captured")).toBe(true)
    expect(orderMatchesPaymentBucket(row("not_paid"), "captured")).toBe(false)
  })
})
