import { describe, expect, it } from "vitest"

import { orderMatchesStatusBucket } from "./orderStatusFilter"
import type { OrderListRow } from "./orderTypes"

function row(partial?: Partial<OrderListRow>): OrderListRow {
  return {
    id: "ord_stub",
    displayId: "1",
    customerName: "Test",
    customerEmail: "t@example.com",
    createdAt: "2026-05-01T10:00:00.000Z",
    currencyCode: "dkk",
    totalMinor: 100,
    orderStatus: "pending",
    paymentStatus: "not_paid",
    fulfillmentStatus: "not_fulfilled",
    ...partial,
  }
}

describe("orderMatchesStatusBucket", () => {
  it('matches pending when workflow status is "pending"', () => {
    const r = row({ orderStatus: "pending" })
    expect(orderMatchesStatusBucket(r, "pending")).toBe(true)
    expect(orderMatchesStatusBucket(r, "processing")).toBe(false)
  })

  it('matches cancelled for American or British spelling', () => {
    expect(orderMatchesStatusBucket(row({ orderStatus: "canceled" }), "cancelled")).toBe(true)
    expect(orderMatchesStatusBucket(row({ orderStatus: "cancelled" }), "cancelled")).toBe(true)
  })

  it("matches delivered fulfillment_status values", () => {
    expect(orderMatchesStatusBucket(row({ fulfillmentStatus: "delivered" }), "delivered")).toBe(
      true
    )
    expect(
      orderMatchesStatusBucket(row({ fulfillmentStatus: "partially_delivered" }), "delivered")
    ).toBe(true)
  })

  it("matches shipped when fulfillment shipped or partially_shipped", () => {
    expect(orderMatchesStatusBucket(row({ fulfillmentStatus: "shipped" }), "shipped")).toBe(true)
    expect(
      orderMatchesStatusBucket(row({ fulfillmentStatus: "partially_shipped" }), "shipped")
    ).toBe(true)
  })

  it("matches processing when payment captured but not fulfilled", () => {
    const r = row({
      paymentStatus: "captured",
      fulfillmentStatus: "not_fulfilled",
      orderStatus: "completed",
    })
    expect(orderMatchesStatusBucket(r, "processing")).toBe(true)
    expect(orderMatchesStatusBucket(r, "pending")).toBe(false)
  })

  it("always matches all bucket", () => {
    expect(orderMatchesStatusBucket(row({ id: "ord_a" }), "all")).toBe(true)
  })
})
