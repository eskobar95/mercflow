import { fireEvent, render, screen, within } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { SubscriptionsTable } from "@/components/subscriptions/SubscriptionsTable"
import type { AdminSubscriptionRow } from "@/features/subscriptions"

const baseRow = {
  store_id: "store_1",
  product_id: "prod_1",
  variant_id: "pv_1",
  stripe_subscription_id: null,
  current_period_start: "2026-05-01T00:00:00.000Z",
  current_period_end: "2026-06-01T00:00:00.000Z",
  cancelled_at: null,
  pause_requested_at: null,
} as const

describe("SubscriptionsTable", (): void => {
  it("renders subscription rows and supports header sort toggles", async (): Promise<void> => {
    const rows: AdminSubscriptionRow[] = [
      {
        ...baseRow,
        id: "sub_b",
        customer_id: "cus_b",
        status: "active",
        interval: "biweekly",
        next_renewal_at: "2026-06-01T00:00:00.000Z",
        customer_display: "Bea Tester",
        product_label: "Coffee — Small",
      },
      {
        ...baseRow,
        id: "sub_a",
        customer_id: "cus_a",
        status: "paused",
        interval: "monthly",
        next_renewal_at: "2026-05-01T00:00:00.000Z",
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
    expect(within(grid).getByText("Monthly")).toBeTruthy()
  })
})
