import { render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"

import { describe, expect, it } from "vitest"

import { ConnectorOverviewGrid } from "@/components/connectors/ConnectorOverviewGrid"
import type { ConnectorListItemDto } from "@/features/connectors/types"

const FOUR_CONNECTORS: ConnectorListItemDto[] = [
  {
    type: "shipmondo",
    active: true,
    configured: true,
    lastTestedAt: "2026-05-01T10:00:00.000Z",
    connectionHealth: "ok",
    status: "connected",
  },
  {
    type: "stripe",
    active: false,
    configured: true,
    lastTestedAt: null,
    connectionHealth: "untested",
    status: "not_configured",
  },
  {
    type: "plunk",
    active: false,
    configured: false,
    lastTestedAt: null,
    connectionHealth: null,
    status: "not_configured",
  },
  {
    type: "gtm",
    active: false,
    configured: false,
    lastTestedAt: null,
    connectionHealth: null,
    status: "not_configured",
  },
]

describe("ConnectorOverviewGrid", (): void => {
  it("renders four connector cards with the expected status badges", (): void => {
    render(
      <MemoryRouter>
        <ConnectorOverviewGrid connectors={FOUR_CONNECTORS} />
      </MemoryRouter>
    )

    expect(screen.getByText("Shipmondo")).toBeInTheDocument()
    expect(screen.getByText("Stripe")).toBeInTheDocument()
    expect(screen.getByText("Plunk")).toBeInTheDocument()
    expect(screen.getByText("Google Tag Manager")).toBeInTheDocument()

    const configureLinks = screen.getAllByRole("link", { name: "Configure" })
    expect(configureLinks).toHaveLength(4)
    expect(
      configureLinks.map((link) => link.getAttribute("href")).sort()
    ).toEqual([
      "/settings/connectors/gtm",
      "/settings/connectors/plunk",
      "/settings/connectors/shipmondo",
      "/settings/connectors/stripe",
    ])

    const shipmondoSurface = screen.getByTestId("connector-card-shipmondo")
    expect(within(shipmondoSurface).getByText("Active")).toBeInTheDocument()
    expect(within(shipmondoSurface).getByText("API reachable")).toBeInTheDocument()

    const stripeSurface = screen.getByTestId("connector-card-stripe")
    expect(within(stripeSurface).getByText("Inactive")).toBeInTheDocument()
    expect(within(stripeSurface).getByText("Not tested yet")).toBeInTheDocument()

    for (const slug of ["plunk", "gtm"] as const) {
      expect(
        within(screen.getByTestId(`connector-card-${slug}`)).getByText("Not configured")
      ).toBeInTheDocument()
    }
  })
})
