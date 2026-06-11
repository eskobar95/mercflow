import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { SETTINGS_LANDING_SECTIONS } from "@/config/settingsSections"
import { SettingsPage } from "@/pages/SettingsPage"

describe("SettingsPage", (): void => {
  it("renders a landing card for every settings sub-section", (): void => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )

    expect(SETTINGS_LANDING_SECTIONS.length).toBeGreaterThanOrEqual(7)

    const links = screen.getAllByRole("link")
    for (const section of SETTINGS_LANDING_SECTIONS) {
      const match = links.find((link) => link.getAttribute("href") === section.to)
      expect(match, `missing card link for ${section.title}`).toBeDefined()
    }
  })
})
