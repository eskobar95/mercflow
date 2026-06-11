import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { AppSidebar } from "@/components/layout/AppSidebar"
import {
  contentSidebarSection,
  primarySidebarNav,
  settingsSidebarSection,
  type SidebarNavItem,
} from "@/config/sidebarNav"
import { SETTINGS_PATHS } from "@/config/settingsSections"

function renderSidebar(
  initialEntries?: string[],
): ReturnType<typeof render> {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={initialEntries}>
        <AppSidebar />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function settingsLeafItems(items: SidebarNavItem[]): SidebarNavItem[] {
  return items.filter((item) => !item.subItems || item.subItems.length === 0)
}

describe("AppSidebar", (): void => {
  it("renders leaf items as links and expandable parents as buttons", (): void => {
    renderSidebar()

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

    expect(screen.getByText("Content")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()

    for (const item of contentSidebarSection.items) {
      const link = screen.getByRole("link", { name: item.label })
      expect(link).toHaveAttribute("href", item.to)
    }

    const settingsSection = screen.getByText("Settings").closest("div")
    expect(settingsSection).toBeTruthy()

    for (const item of settingsLeafItems(settingsSidebarSection.items)) {
      const links = within(settingsSection as HTMLElement).getAllByRole("link")
      const match = links.find((link) => link.getAttribute("href") === item.to)
      expect(match, `missing settings link for ${item.label}`).toBeDefined()
    }

    expect(screen.getByRole("button", { name: /^Shipping$/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^SEO$/i })).toBeInTheDocument()
  })

  it("reveals sub-items when an expandable parent is toggled open", (): void => {
    renderSidebar(["/orders"])

    const navRoots = screen.getAllByRole("complementary", { name: /Main navigation/i })
    expect(navRoots[0]).toBeDefined()
    const sidebarRoot = navRoots[0] as HTMLElement
    const productsButton = within(sidebarRoot).getByRole("button", { name: /^Products$/i })
    expect(productsButton).toHaveAttribute("aria-expanded", "false")

    fireEvent.click(productsButton)
    expect(productsButton).toHaveAttribute("aria-expanded", "true")

    expect(screen.getByRole("link", { name: "Catalogue" })).toHaveAttribute(
      "href",
      "/products"
    )
    expect(screen.getByRole("link", { name: "Categories" })).toHaveAttribute(
      "href",
      "/product-categories"
    )
  })

  it("auto-expands Shipping when a packaging route is active", (): void => {
    renderSidebar([SETTINGS_PATHS.shippingPackaging])

    const navRoots = screen.getAllByRole("complementary", { name: /Main navigation/i })
    expect(navRoots[0]).toBeDefined()
    const sidebarRoot = navRoots[0] as HTMLElement
    const shippingButton = within(sidebarRoot).getByRole("button", { name: /^Shipping$/i })
    expect(shippingButton).toHaveAttribute("aria-expanded", "true")

    expect(screen.getByRole("link", { name: "Packaging" })).toHaveAttribute(
      "href",
      SETTINGS_PATHS.shippingPackaging,
    )
    expect(screen.getByRole("link", { name: "Carriers" })).toHaveAttribute(
      "href",
      SETTINGS_PATHS.shippingCarriers,
    )
  })

  it("auto-expands the parent when its child route is active", (): void => {
    renderSidebar(["/product-categories"])

    const navRoots = screen.getAllByRole("complementary", { name: /Main navigation/i })
    expect(navRoots[0]).toBeDefined()
    const sidebarRoot = navRoots[0] as HTMLElement
    const productsButton = within(sidebarRoot).getByRole("button", { name: /^Products$/i })
    expect(productsButton).toHaveAttribute("aria-expanded", "true")

    const categoriesLinks = screen.getAllByRole("link", { name: "Categories" })
    const categoriesActive = categoriesLinks.filter(
      (link) => link.getAttribute("aria-current") === "page"
    )
    expect(categoriesActive).toHaveLength(1)
  })

  it("matches the structural snapshot", (): void => {
    const { container } = renderSidebar()

    const aside = within(container).getByRole("complementary", {
      name: /main navigation/i,
    })
    expect(aside).toMatchSnapshot()
  })
})
