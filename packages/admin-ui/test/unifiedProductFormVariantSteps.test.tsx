import type { JSX } from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, within } from "@testing-library/react"
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

function renderCreateForm(): ReturnType<typeof render> {
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
  return render(tree)
}

describe("UnifiedProductForm variant workflow", (): void => {
  it("starts with the progressive options CTA and hides the pricing grid", (): void => {
    renderCreateForm()
    expect(screen.getByRole("heading", { name: /step 1 — details/i })).toBeTruthy()
    expect(screen.getByRole("heading", { name: /step 2 — variant matrix/i })).toBeTruthy()
    expect(screen.getByRole("button", { name: /add options like size or color/i })).toBeTruthy()
    expect(screen.queryByRole("heading", { name: /step 3 — pricing/i })).toBeNull()
    expect(screen.queryByRole("table", { name: /variant pricing grid/i })).toBeNull()
  })

  it("reveals the pricing grid after the first option is defined", (): void => {
    renderCreateForm()
    fireEvent.click(screen.getByRole("button", { name: /add options like size or color/i }))
    fireEvent.change(screen.getByLabelText(/option 1/i), { target: { value: "Size" } })
    fireEvent.change(screen.getByLabelText(/^values$/i), { target: { value: "S, M, L" } })
    expect(screen.getByRole("heading", { name: /step 3 — pricing/i })).toBeTruthy()
    const pricingTable = screen.getByRole("table", { name: /variant pricing grid/i })
    expect(within(pricingTable).getAllByRole("row")).toHaveLength(4)
    expect(screen.getByRole("heading", { name: /step 4 — shipping/i })).toBeTruthy()
  })
})
