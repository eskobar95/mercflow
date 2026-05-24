import { describe, expect, it } from "vitest"

import type { AdminOrderLite } from "@/features/customers/customersAdminTypes"
import {
  mergePaidSpendSummary,
  summarizeLifetimeDisplayText,
} from "@/features/customers/customersPaidSpend"

function order(overrides: Partial<AdminOrderLite>): AdminOrderLite {
  return {
    id: "ord_1",
    currency_code: "usd",
    payment_status: "captured",
    total: "100",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("customersPaidSpend", () => {
  it("sums only captured payment rows into lifetime totals", (): void => {
    const merged = mergePaidSpendSummary(
      {
        paidOrderCount: 0,
        totalOrderCount: 0,
        lifetimeByCurrency: new Map(),
      },
      [
        order({ payment_status: "captured", total: "1000" }),
        order({ payment_status: "pending", total: "5000", id: "ord_2" }),
      ]
    )
    expect(merged.totalOrderCount).toBe(2)
    expect(merged.paidOrderCount).toBe(1)
    expect(merged.lifetimeByCurrency.get("usd")).toBe(1000n)
    const summary = summarizeLifetimeDisplayText(merged)
    expect(summary.kind).toBe("single")
    if (summary.kind === "single") {
      expect(summary.currency).toBe("usd")
      expect(summary.minor).toBe(1000n)
    }
  })

  it("marks mixed currencies for display", (): void => {
    const merged = mergePaidSpendSummary(
      {
        paidOrderCount: 0,
        totalOrderCount: 0,
        lifetimeByCurrency: new Map(),
      },
      [
        order({ currency_code: "usd", payment_status: "captured", total: "50", id: "a" }),
        order({
          currency_code: "eur",
          payment_status: "completed",
          total: "30",
          id: "b",
        }),
      ]
    )
    expect(summarizeLifetimeDisplayText(merged).kind).toBe("mixed")
  })
})
