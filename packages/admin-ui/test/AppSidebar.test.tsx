import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { AppSidebar } from "@/components/layout/AppSidebar"
import {
  contentSidebarSection,
  primarySidebarNav,
  settingsSidebarSection,
} from "@/config/sidebarNav"

describe("AppSidebar", (): void => {
  it("renders leaf items as links and expandable parents as buttons", (): void => {
    render(
      <MemoryRouter>
        <AppSidebar />
      </MemoryRouter>
    )

    // Top-level: each leaf item is a link, each parent with subItems is a button.
    for (const item of primarySidebarNav) {
      if (item.subItems && item.subItems.length > 0) {
        expect(
          screen.getByRole("button", { name: new RegExp(`^${item.label}$`, "i") })
        ).toBeInTheDocument()
      } else {
        const link = screen.getByRole("link", { name: item.label })
        expect(link).toHaveAttribute("href", item.to)
      }
    }

    // Content + Settings sections render their section labels and leaf links.
    expect(screen.getByText("Content")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()

    for (const item of [...contentSidebarSection.items, ...settingsSidebarSection.items]) {
      const link = screen.getByRole("link", { name: item.label })
      expect(link).toHaveAttribute("href", item.to)
    }
  })

  it("reveals sub-items when an expandable parent is toggled open", (): void => {
    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <AppSidebar />
      </MemoryRouter>
    )

    const productsButton = screen.getByRole("button", { name: /^Products$/i })
    // /orders → Products parent should be collapsed by default.
    expect(productsButton).toHaveAttribute("aria-expanded", "false")

    fireEvent.click(productsButton)
    expect(productsButton).toHaveAttribute("aria-expanded", "true")

    // Sub-items are real navigable links.
    expect(screen.getByRole("link", { name: "Catalogue" })).toHaveAttribute(
      "href",
      "/products"
    )
    expect(screen.getByRole("link", { name: "Categories" })).toHaveAttribute(
      "href",
      "/product-categories"
    )
  })

  it("auto-expands the parent when its child route is active", (): void => {
    render(
      <MemoryRouter initialEntries={["/product-categories"]}>
        <AppSidebar />
      </MemoryRouter>
    )

    const productsButton = screen.getByRole("button", { name: /^Products$/i })
    expect(productsButton).toHaveAttribute("aria-expanded", "true")

    // Active sub-item carries aria-current.
    const categoriesLink = screen.getByRole("link", { name: "Categories" })
    expect(categoriesLink).toHaveAttribute("aria-current", "page")
  })

  it("matches the structural snapshot", (): void => {
    const { container } = render(
      <MemoryRouter>
        <AppSidebar />
      </MemoryRouter>
    )

    // Restrict to the <aside> so we don't snapshot the temporary scroll container.
    const aside = within(container).getByRole("complementary", {
      name: /main navigation/i,
    })
    expect(aside).toMatchSnapshot()
  })
})
