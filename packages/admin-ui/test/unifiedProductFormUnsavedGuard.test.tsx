import type { JSX } from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

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

function renderCreateForm(): void {
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
}

describe("UnifiedProductForm unsaved guard", (): void => {
  afterEach((): void => {
    document.title = "MercFlow Admin"
  })

  it("uses the clean create title before the form is edited", async (): Promise<void> => {
    renderCreateForm()

    await waitFor((): void => {
      expect(document.title).toBe("Create product")
    })
  })

  it("prefixes document.title after a catalog field changes", async (): Promise<void> => {
    renderCreateForm()

    fireEvent.change(screen.getByLabelText(/product title/i), {
      target: { value: "Summer hoodie" },
    })

    await waitFor((): void => {
      expect(document.title).toBe("• Summer hoodie")
    })
  })
})
