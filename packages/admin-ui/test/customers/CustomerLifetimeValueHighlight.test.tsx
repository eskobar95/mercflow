import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CustomerLifetimeValueHighlight } from "@/components/customers/CustomerLifetimeValueHighlight"
import type { CustomerPaidSpendSummary } from "@/features/customers/customersAdminTypes"

function buildSummary(overrides: Partial<CustomerPaidSpendSummary>): CustomerPaidSpendSummary {
  return {
    paidOrderCount: 2,
    totalOrderCount: 4,
    lifetimeByCurrency: new Map([
      ["usd", 5_699n],
    ]),
    ...overrides,
  }
}

describe("CustomerLifetimeValueHighlight", () => {
  it("shows skeleton copy while aggregates load", (): void => {
    render(<CustomerLifetimeValueHighlight summary={null} storeCurrencyCode="usd" isLoading />)

    expect(screen.getByLabelText(/Calculating lifetime value/i)).toBeInTheDocument()
  })

  it("shows mixed currency messaging when summaries span wallets", (): void => {
    const summary = buildSummary({
      lifetimeByCurrency: new Map([
        ["usd", 1_100n],
        ["dkk", 8_990n],
      ]),
    })

    render(<CustomerLifetimeValueHighlight summary={summary} storeCurrencyCode="usd" />)

    expect(screen.getByText(/Multiple currencies/i)).toBeInTheDocument()
    expect(screen.getByText(/Paid orders in lifetime/i)).toBeInTheDocument()
  })
})
