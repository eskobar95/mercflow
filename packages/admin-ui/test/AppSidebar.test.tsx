import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { AppSidebar } from "@/components/layout/AppSidebar"
import { getAllSidebarNavItems } from "@/config/sidebarNav"

describe("AppSidebar", (): void => {
  it("renders all primary and section nav items with correct hrefs", (): void => {
    const { container } = render(
      <MemoryRouter>
        <AppSidebar />
      </MemoryRouter>
    )

    const items = getAllSidebarNavItems()
    for (const item of items) {
      const link = screen.getByRole("link", { name: item.label })
      expect(link).toHaveAttribute("href", item.to)
    }

    expect(screen.getByText("Content")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })
})
