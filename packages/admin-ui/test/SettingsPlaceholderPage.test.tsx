import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { SettingsPlaceholderPage } from "@/pages/settings/SettingsPlaceholderPage"

describe("SettingsPlaceholderPage", (): void => {
  it("renders title, description, and Coming soon callout", (): void => {
    render(
      <MemoryRouter>
        <SettingsPlaceholderPage
          title="Policies"
          description="Privacy policy and terms of service for your storefront."
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole("heading", { name: "Policies" })).toBeDefined()
    expect(screen.getByText("Privacy policy and terms of service for your storefront.")).toBeDefined()
    expect(screen.getByRole("status")).toBeDefined()
    expect(screen.getByText("Coming soon")).toBeDefined()
  })
})
