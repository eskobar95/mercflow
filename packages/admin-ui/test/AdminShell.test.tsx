import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { AdminShell } from "@/components/layout/AdminShell"

describe("AdminShell", (): void => {
  it("renders shell chrome and exposes the main content region", (): void => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <AdminShell />,
          children: [
            {
              index: true,
              element: <p>Test page body</p>,
            },
          ],
        },
      ],
      { initialEntries: ["/"] },
    )

    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    expect(
      screen.getByRole("complementary", { name: "Main navigation" })
    ).toBeInTheDocument()
    expect(screen.getByRole("banner")).toBeInTheDocument()
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content")
    expect(screen.getByText("Test page body")).toBeInTheDocument()
  })
})
