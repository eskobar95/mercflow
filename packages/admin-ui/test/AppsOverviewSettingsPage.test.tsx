import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { CONNECTOR_CONFIGURE_PATHS } from "@/features/connectors/connectorConfigurePaths"
import { CONNECTOR_CATALOG } from "@/features/connectors/connectorsCatalog"
import { CONNECTOR_SLUGS } from "@/features/connectors/types"
import { AppsOverviewSettingsPage } from "@/pages/settings/AppsOverviewSettingsPage"

vi.mock("@/hooks/useAdminConnectors", () => ({
  useAdminConnectors: (): {
    status: "success"
    connectors: Array<{
      type: (typeof CONNECTOR_SLUGS)[number]
      active: boolean
      configured: boolean
      lastTestedAt: string | null
      connectionHealth: "ok" | null
      status: "connected" | "error" | "not_configured"
    }>
  } => ({
    status: "success",
    connectors: CONNECTOR_SLUGS.map((type) => ({
      type,
      active: type === "stripe",
      configured: type === "stripe",
      lastTestedAt: type === "stripe" ? "2026-05-01T10:00:00.000Z" : null,
      connectionHealth: type === "stripe" ? "ok" : null,
      status: type === "stripe" ? "connected" : "not_configured",
    })),
  }),
}))

describe("AppsOverviewSettingsPage", (): void => {
  it("renders all connector cards with status badges and configure links", (): void => {
    render(
      <MemoryRouter>
        <AppsOverviewSettingsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole("heading", { name: "Apps" })).toBeDefined()

    for (const slug of CONNECTOR_SLUGS) {
      expect(screen.getByText(CONNECTOR_CATALOG[slug].name)).toBeDefined()
      const card = screen.getByTestId(`app-connector-card-${slug}`)
      expect(card).toBeDefined()
      const configureLink = card.querySelector("a[href]")
      expect(configureLink?.getAttribute("href")).toBe(CONNECTOR_CONFIGURE_PATHS[slug])
    }

    expect(screen.getByText("Connected")).toBeDefined()
    expect(screen.getAllByText("Not configured")).toHaveLength(3)
  })
})
