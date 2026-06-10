import type { JSX } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { UnifiedProductForm } from "@/components/products/UnifiedProductForm"
import { ToastProvider } from "@/components/ui/Toast"
globalThis.ResizeObserver = class { disconnect() {} observe() {} unobserve() {} }
vi.mock("@/medusa-admin/medusaAdminFetch", () => ({ resolveMedusaAdminBackendUrl: (): null => null }))
function renderForm(): ReturnType<typeof render> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const tree: JSX.Element = (
    <QueryClientProvider client={client}><ToastProvider><MemoryRouter><UnifiedProductForm mode="create" /></MemoryRouter></ToastProvider></QueryClientProvider>
  )
  return render(tree)
}
describe("UnifiedProductForm shipping", () => {
  it("shows physical toggle and collapses fields", () => {
    renderForm()
    expect(screen.getByRole("heading", { name: /step 4 — shipping/i })).toBeTruthy()
    const toggle = screen.getByRole("switch", { name: /physical product/i })
    fireEvent.click(toggle)
    expect(toggle.getAttribute("aria-checked")).toBe("false")
  })
})
