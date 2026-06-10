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

describe("OrderDetailPage — fulfillment mutations", () => {
  const paidUnfulfilledOrder = {
    id: "ord_fulfill_flow",
    display_id: 3100,
    status: "pending",
    payment_status: "captured",
    fulfillment_status: "not_fulfilled",
    email: "x@example.com",
    currency_code: "dkk",
    items: [
      {
        id: "oli_ff_1",
        title: "Item",
        quantity: 2,
        unit_price: 500,
        total: 1000,
      },
    ],
    payment_collections: [
      {
        payments: [
          {
            id: "pay_ff",
            status: "captured",
            captured_at: "2026-05-10T10:00:00.000Z",
          },
        ],
      },
    ],
    fulfillments: [] as Record<string, string | undefined>[],
    summary: {},
    created_at: "2026-05-09T09:00:00.000Z",
    updated_at: "2026-05-10T10:00:00.000Z",
    total: 1000,
  }

  beforeEach(() => {
    vi.stubEnv("VITE_MEDUSA_ADMIN_BACKEND_URL", "http://localhost:9000")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    cleanup()
    vi.restoreAllMocks()
  })

  it("POST /fulfillments with line items then refetches GET order", async () => {
    let getCalls = 0
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === "string" ? input : input.toString()
      const orderDetailPath = `/admin/orders/${encodeURIComponent("ord_fulfill_flow")}`
      const isOrderDetailGet =
        (init?.method === undefined || init.method === "GET") &&
        (() => {
          try {
            return new URL(url).pathname.endsWith(orderDetailPath)
          } catch {
            const pathOnly = url.split("?")[0] ?? url
            return pathOnly.endsWith(orderDetailPath)
          }
        })()
      if (url.startsWith("http://localhost:9000/admin/stock-locations")) {
        return jsonResponse({ stock_locations: [{ id: "sloc_test" }] })
      }
      if (
        url ===
          `http://localhost:9000/admin/orders/${encodeURIComponent("ord_fulfill_flow")}/fulfillments` &&
        init?.method === "POST"
      ) {
        const parsed: unknown = JSON.parse((init.body as string) ?? "{}")
        expect(parsed).toEqual({
          items: [{ id: "oli_ff_1", quantity: 2 }],
          location_id: "sloc_test",
        })
        paidUnfulfilledOrder.fulfillments = [{ id: "ful_new", created_at: "2026-05-10T11:00:00.000Z" }]
        paidUnfulfilledOrder.fulfillment_status = "not_fulfilled"
        return jsonResponse({})
      }
      if (isOrderDetailGet) {
        getCalls += 1
        return jsonResponse({
          order: paidUnfulfilledOrder,
        })
      }
      return jsonResponse({}, 404)
    })
    globalThis.fetch = fetchSpy as unknown as typeof fetch

    render(
      <MemoryRouter initialEntries={["/orders/ord_fulfill_flow"]}>
        <Routes>
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByRole("heading", { name: /Order #3100/ })

    fireEvent.click(await screen.findByRole("button", { name: "Create fulfillment" }))

    await screen.findByRole("heading", { name: "Create fulfillment?" })
    const confirmBtn = await screen.findByRole("button", { name: "Confirm" })
    await waitFor(() => {
      expect(confirmBtn).not.toBeDisabled()
    })
    fireEvent.click(confirmBtn)

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())

    await waitFor(() => {
      expect(
        fetchSpy.mock.calls.some(
          (call) =>
            typeof call[0] === "string" &&
            call[0].includes("/fulfillments") &&
            call[1]?.method === "POST",
        ),
      ).toBe(true)
    })

    await waitFor(() => {
      expect(getCalls).toBeGreaterThanOrEqual(2)
    })
  })
})
