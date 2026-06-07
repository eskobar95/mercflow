import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import type { ReactNode } from "react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ToastProvider } from "@/components/ui/Toast"
import { MOCK_PRODUCTS } from "@/data/mockProducts"

import { ProductDetailPage } from "@/pages/ProductDetailPage"
import { ProductListPage } from "@/pages/ProductListPage"

function renderWithProviders(ui: ReactNode): void {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ToastProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

describe("ProductListPage mocked API response", (): void => {
  beforeEach((): void => {
    vi.unstubAllEnvs()
    // Force the mock data path: with a backend URL set the catalogue hook hits
    // the live Medusa SDK (empty in jsdom), so the seeded rows never render.
    vi.stubEnv("VITE_MEDUSA_ADMIN_BACKEND_URL", "")
  })

  it("renders seeded mock rows supplied by TanStack Query", async (): Promise<void> => {
    renderWithProviders(<ProductListPage />)

    // The page title now lives in the global TopBar (page chrome), not in the
    // page body, so assert readiness via the catalogue table the page renders.
    await waitFor(() => {
      expect(
        screen.getByRole("table", { name: /product catalogue results/i }),
      ).toBeTruthy()
    })

    const reference = MOCK_PRODUCTS[0]
    if (!reference) {
      throw new Error("mock fixtures missing")
    }

    await waitFor(() => {
      expect(screen.getAllByRole("columnheader", { name: /variants/i }).length > 0).toBe(true)
      expect(screen.getAllByText(reference.title).length > 0).toBe(true)
    })

    await waitFor(() => {
      if (reference.stockTotal === null) {
        throw new Error("fixture needs deterministic stock totals")
      }
      expect(screen.getAllByText(String(reference.stockTotal)).length > 0).toBe(true)
    })
  })
})

describe("ProductDetailPage unified variants table", (): void => {
  it("surfaces SKU + merged stock metric on the Variants tab", async (): Promise<void> => {
    const fixture = MOCK_PRODUCTS[4]
    if (!fixture || fixture.stockTotal === null) {
      throw new Error("fixture missing")
    }

    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter initialEntries={[`/products/${fixture.id}`]}>
          <Routes>
            <Route path="/products/:productId" element={<ProductDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    const variantsTab = await screen.findByRole("tab", { name: /^variants$/iu })
    variantsTab.click()

    const table = await screen.findByRole("table", {
      name: /variants with price and inventory/i,
    })

    expect(within(table).getByRole("columnheader", { name: /^variant$/i })).toBeTruthy()
    expect(within(table).getByRole("columnheader", { name: /^stock$/i })).toBeTruthy()
    expect(within(table).getByText(fixture.sku)).toBeTruthy()
    expect(within(table).getByText(String(fixture.stockTotal))).toBeTruthy()
  })
})
