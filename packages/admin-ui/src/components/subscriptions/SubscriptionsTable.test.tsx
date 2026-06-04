import { fireEvent, render, screen, within } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { SubscriptionsTable } from "@/components/subscriptions/SubscriptionsTable"
import type { AdminSubscriptionRow } from "@/features/subscriptions"

describe("SubscriptionsTable", (): void => {
  it("renders subscription rows and supports header sort toggles", async (): Promise<void> => {
    const rows: AdminSubscriptionRow[] = [
      {
        id: "sub_b",
        customer_id: "cus_b",
        status: "active",
        cycle_weeks: 2,
        next_renewal_at: "2026-06-01T00:00:00.000Z",
        variant_id: "pv_b",
        discount_percent: 5,
        customer_display: "Bea Tester",
        product_label: "Coffee — Small",
      },
      {
        id: "sub_a",
        customer_id: "cus_a",
        status: "paused",
        cycle_weeks: 4,
        next_renewal_at: "2026-05-01T00:00:00.000Z",
        variant_id: "pv_a",
        discount_percent: 0,
        customer_display: "Ada Customer",
        product_label: "Tea — Monthly",
      },
    ]

    render(
      <BrowserRouter>
        <SubscriptionsTable rows={rows} isLoading={false} />
      </BrowserRouter>
    )

    const grid = screen.getByRole("table", { name: /^subscriptions$/i })
    expect(within(grid).getAllByRole("row")).toHaveLength(3)

    fireEvent.click(
      within(grid).getByRole("button", { name: /^customer$/i })
    )

    expect(within(grid).getByRole("cell", { name: /^Ada Customer$/i })).toBeTruthy()
    expect(within(grid).getByText("Tea — Monthly")).toBeTruthy()
  })
})
