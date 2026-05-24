import type { JSX } from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { UnifiedProductForm } from "@/components/products/UnifiedProductForm"
import { ToastProvider } from "@/components/ui/Toast"

class ResizeObserverMock {
  disconnect(): void {}
  observe(): void {}
  unobserve(): void {}
}

globalThis.ResizeObserver = ResizeObserverMock

vi.mock("@/medusa-admin/medusaAdminFetch", () => ({
  resolveMedusaAdminBackendUrl: (): null => null,
}))

describe("UnifiedProductForm variant workflow", (): void => {
  it("shows the stacked steps for catalogue creation", (): void => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const tree: JSX.Element = (
      <QueryClientProvider client={client}>
        <ToastProvider>
          <MemoryRouter>
            <UnifiedProductForm mode="create" />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    )

    render(tree)

    expect(screen.getByRole("heading", { name: /step 1 — details/i })).toBeTruthy()
    expect(screen.getByRole("heading", { name: /step 2 — variant matrix/i })).toBeTruthy()
    expect(screen.getByRole("heading", { name: /step 3 — pricing/i })).toBeTruthy()
    expect(screen.getByRole("table", { name: /variant pricing grid/i })).toBeTruthy()
  })
})
