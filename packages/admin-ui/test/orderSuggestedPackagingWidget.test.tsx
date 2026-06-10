import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"

import { OrderDetailPage } from "@/pages/OrderDetailPage"

vi.mock("@/hooks/useShipmondoLabelGenerationReady", () => ({
  useShipmondoLabelGenerationReady: (): { isReady: boolean; isLoading: boolean } => ({
    isReady: false,
    isLoading: false,
  }),
}))

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

const samplePackagingType = {
  id: "pkg_small",
  store_id: "store_1",
  name: "Small box",
  type: "box",
  length_mm: 300,
  width_mm: 200,
  height_mm: 150,
  max_weight_g: 2_000,
  is_active: true,
  created_at: "2026-06-10T12:00:00.000Z",
  updated_at: "2026-06-10T12:00:00.000Z",
  deleted_at: null,
}

describe("OrderSuggestedPackagingWidget", (): void => {
  beforeEach(() => {
    vi.stubEnv("VITE_MEDUSA_ADMIN_BACKEND_URL", "http://localhost:9000")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    cleanup()
    vi.restoreAllMocks()
  })

  it("shows suggestion with utilisation and exposes confirmed packaging id", async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === "string" ? input : input.toString()
      if (url.includes("/admin/orders/ord_pkg")) {
        return jsonResponse({
          order: {
            id: "ord_pkg",
            display_id: 4200,
            status: "pending",
            payment_status: "captured",
            fulfillment_status: "not_fulfilled",
            email: "pack@example.com",
            currency_code: "dkk",
            items: [
              {
                id: "oli_1",
                title: "Sized item",
                variant_id: "variant_1",
                quantity: 1,
                unit_price: 1000,
                total: 1000,
              },
            ],
            payment_collections: [{ payments: [{ id: "pay_1", status: "captured" }] }],
            fulfillments: [],
            summary: {},
            created_at: "2026-06-10T10:00:00.000Z",
            updated_at: "2026-06-10T10:00:00.000Z",
            total: 1000,
          },
        })
      }
      if (url.endsWith("/admin/packaging-types/suggest") && init?.method === "POST") {
        return jsonResponse({
          suggested: samplePackagingType,
          total_volume_mm3: 6_000_000,
          total_weight_g: 500,
        })
      }
      if (url.includes("/admin/packaging-types?") && (init?.method === undefined || init.method === "GET")) {
        return jsonResponse({
          packaging_types: [samplePackagingType],
          count: 1,
          limit: 100,
          offset: 0,
        })
      }
      return jsonResponse({}, 404)
    })
    globalThis.fetch = fetchSpy as unknown as typeof fetch

    render(
      <MemoryRouter initialEntries={["/orders/ord_pkg"]}>
        <Routes>
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole("region", { name: "Suggested packaging" })).toBeInTheDocument()
    expect(await screen.findByText("Small box")).toBeInTheDocument()
    expect(screen.getByText("30×20×15 cm")).toBeInTheDocument()
    expect(screen.getByText(/Utilisation/)).toHaveTextContent("67%")

    const fulfillmentSection = screen.getByRole("region", { name: "Order fulfillment" })
    expect(fulfillmentSection).toHaveAttribute("data-confirmed-packaging-type-id", "pkg_small")

    fireEvent.click(screen.getByRole("button", { name: "Change" }))
    await waitFor(() => {
      expect(fetchSpy.mock.calls.some((call) => String(call[0]).includes("/admin/packaging-types?"))).toBe(
        true,
      )
    })
  })

  it("shows settings link when no packaging fits", async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === "string" ? input : input.toString()
      if (url.includes("/admin/orders/ord_none")) {
        return jsonResponse({
          order: {
            id: "ord_none",
            display_id: 4201,
            status: "pending",
            payment_status: "captured",
            fulfillment_status: "not_fulfilled",
            email: "none@example.com",
            currency_code: "dkk",
            items: [
              {
                id: "oli_1",
                title: "Huge item",
                variant_id: "variant_huge",
                quantity: 1,
                unit_price: 1000,
                total: 1000,
              },
            ],
            payment_collections: [{ payments: [{ id: "pay_1", status: "captured" }] }],
            fulfillments: [],
            summary: {},
            created_at: "2026-06-10T10:00:00.000Z",
            updated_at: "2026-06-10T10:00:00.000Z",
            total: 1000,
          },
        })
      }
      if (url.endsWith("/admin/packaging-types/suggest") && init?.method === "POST") {
        return jsonResponse({
          suggested: null,
          total_volume_mm3: 99_000_000,
          total_weight_g: 5_000,
        })
      }
      return jsonResponse({}, 404)
    })
    globalThis.fetch = fetchSpy as unknown as typeof fetch

    render(
      <MemoryRouter initialEntries={["/orders/ord_none"]}>
        <Routes>
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/No packaging type fits this order/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Settings → Packaging/ })).toHaveAttribute(
      "href",
      "/settings/packaging",
    )
  })
})
