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
      expect(screen.getByText(group.label)).toBeDefined()
      for (const item of group.items) {
        expect(screen.getByRole("link", { name: item.label })).toBeDefined()
      }
    }
  })
})
