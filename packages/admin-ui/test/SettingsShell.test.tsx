import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { SettingsShellSidebar } from "@/components/layout/SettingsShellSidebar"
import { SETTINGS_NAV_GROUPS } from "@/config/settingsNav"

describe("SettingsShellSidebar", (): void => {
  it("renders all eight settings navigation groups", (): void => {
    render(
      <MemoryRouter>
        <SettingsShellSidebar />
      </MemoryRouter>,
    )

    expect(SETTINGS_NAV_GROUPS).toHaveLength(8)

    for (const group of SETTINGS_NAV_GROUPS) {
      expect(screen.getByRole("button", { name: group.label })).toBeDefined()
    }
  })

  it("renders a nav link for every settings sub-item", (): void => {
    render(
      <MemoryRouter initialEntries={["/settings/general"]}>
        <SettingsShellSidebar />
      </MemoryRouter>,
    )

    const links = screen.getAllByRole("link", { hidden: true })
    for (const group of SETTINGS_NAV_GROUPS) {
      for (const item of group.items) {
        const match = links.find((link) => link.getAttribute("href") === item.path)
        expect(match, `missing nav link for ${group.label} → ${item.label}`).toBeDefined()
      }
    }
  })
})
