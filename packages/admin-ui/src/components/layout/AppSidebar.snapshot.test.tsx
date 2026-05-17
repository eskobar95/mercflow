import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { AppSidebar } from "./AppSidebar"

describe("AppSidebar nav labels", (): void => {
  it("matches snapshot of visible primary nav link labels", (): void => {
    render(
      <MemoryRouter>
        <AppSidebar />
      </MemoryRouter>
    )

    const labels = screen
      .getAllByRole("link")
      .map((el) => el.textContent?.trim())
      .filter(Boolean)

    expect(labels).toMatchSnapshot()
  })
})
