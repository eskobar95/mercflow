import { render, screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { mercflowAdminShellRoutes } from "@/appRouter"

describe("AppShell (AdminShell)", (): void => {
  it("renders skip link, application nav, and dashboard home", async (): Promise<void> => {
    const router = createMemoryRouter(mercflowAdminShellRoutes, {
      initialEntries: ["/"],
    })

    render(<RouterProvider router={router} />)

    expect(
      await screen.findByRole("link", {
        name: /skip to main content/i,
        hidden: true,
      })
    ).not.toBeNull()
    expect(
      await screen.findByRole("navigation", { name: /application/i })
    ).not.toBeNull()

    expect(
      await screen.findByRole("heading", { name: /design token integration/i })
    ).not.toBeNull()
  })
})
