import { MemoryRouter } from "react-router-dom"

import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ConnectorsOverviewGrid } from "@/components/connectors/ConnectorsOverviewGrid"
import type { ConnectorAdminListItem } from "@/features/connectors/types"

const SAMPLE_ROWS: ConnectorAdminListItem[] = [
  {
    type: "shipmondo",
    active: false,
    configured: false,
    lastTestedAt: null,
  },
  {
    type: "stripe",
    active: true,
    configured: true,
    lastTestedAt: null,
  },
  {
    type: "plunk",
    active: false,
    configured: true,
    lastTestedAt: null,
  },
  {
    type: "gtm",
    active: true,
    configured: false,
    lastTestedAt: null,
  },
]

describe("ConnectorsOverviewGrid", () => {
  it("renders four connector tiles with badges and Configure links", (): void => {
    render(
      <MemoryRouter>
        <ConnectorsOverviewGrid items={SAMPLE_ROWS} />
      </MemoryRouter>,
    )

    expect(screen.getByText("Shipmondo")).toBeTruthy()
    expect(screen.getByText("Stripe")).toBeTruthy()
    expect(screen.getByText("Plunk")).toBeTruthy()
    expect(screen.getByText(/Google Tag Manager/)).toBeTruthy()

    const shipCard = screen.getByText("Shipmondo").closest("li")!
    expect(within(shipCard).getByText("Not configured")).toBeTruthy()

    const stripeCard = screen.getByText("Stripe").closest("li")!
    expect(within(stripeCard).getByText("Active")).toBeTruthy()

    const plunkCard = screen.getByText("Plunk").closest("li")!
    expect(within(plunkCard).getByText("Inactive")).toBeTruthy()

    const gtmCard = screen.getByText(/Google Tag Manager/).closest("li")!
    expect(within(gtmCard).getByText("Not configured")).toBeTruthy()

    expect(screen.getAllByText("Not configured")).toHaveLength(2)

    const configureLinks = screen.getAllByRole("link", { name: /^Configure / })
    expect(configureLinks).toHaveLength(4)
    expect(configureLinks[0]).toHaveAttribute("href", "/settings/connectors/shipmondo")
    expect(configureLinks[1]).toHaveAttribute("href", "/settings/connectors/stripe")
    expect(configureLinks[2]).toHaveAttribute("href", "/settings/connectors/plunk")
    expect(configureLinks[3]).toHaveAttribute("href", "/settings/connectors/gtm")
  })
})
