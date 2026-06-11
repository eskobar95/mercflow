import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { Breadcrumb } from "@/components/ui/Breadcrumb"

describe("Breadcrumb", () => {
  it("renders linked ancestors and a non-link current page", () => {
    render(
      <MemoryRouter>
        <Breadcrumb
          items={[
            { label: "Orders", href: "/orders?page=2" },
            { label: "#1234" },
          ]}
        />
      </MemoryRouter>,
    )

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" })
    expect(nav).toBeInTheDocument()

    const ordersLink = screen.getByRole("link", { name: "Orders" })
    expect(ordersLink).toHaveAttribute("href", "/orders?page=2")

    const current = screen.getByText("#1234")
    expect(current).toHaveAttribute("aria-current", "page")
    expect(current.tagName).toBe("SPAN")
  })

  it("returns null when items are empty", () => {
    const { container } = render(
      <MemoryRouter>
        <Breadcrumb items={[]} />
      </MemoryRouter>,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
