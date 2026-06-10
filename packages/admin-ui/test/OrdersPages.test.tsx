import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen, waitFor } from "@testing-library/react"

import { OrderDetailPage } from "@/pages/OrderDetailPage"
import { OrdersListPage } from "@/pages/OrdersListPage"

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

const sampleOrderPayload = {
  id: "ord_test",
  display_id: 1001,
  status: "pending",
  payment_status: "not_paid",
  fulfillment_status: "not_fulfilled",
  email: "ada@example.com",
  currency_code: "dkk",
  customer: {
    id: "cus_1",
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@example.com",
  },
  shipping_address: {
    first_name: "Ada",
    last_name: "Lovelace",
    address_1: "Rue de Rivoli 1",
    city: "Paris",
    postal_code: "75001",
    country_code: "fr",
    province: null,
  },
  items: [
    {
      id: "li_1",
      title: "Sample SKU",
      variant_title: "M / Indigo",
      quantity: 2,
      unit_price: 5000,
      total: 10000,
      thumbnail: "https://example.com/t.jpg",
    },
  ],
  payment_collections: [
    {
      payments: [{ status: "captured", created_at: "2026-05-02T09:30:00.000Z" }],
    },
  ],
  fulfillments: [],
  summary: {},
  created_at: "2026-05-01T10:15:00.000Z",
  updated_at: "2026-05-02T09:31:00.000Z",
  total: 11_895,
}

describe("OrdersListPage", () => {
  const fetchSpy = vi.fn(async (): Promise<Response> =>
    Promise.resolve(jsonResponse({
      orders: [
        sampleOrderPayload,
        {
          id: "ord_2",
          display_id: 1002,
          status: "completed",
          payment_status: "captured",
          fulfillment_status: "shipped",
          email: "be@example.com",
          currency_code: "dkk",
          customer: {
            id: null,
            first_name: null,
            last_name: null,
            email: "be@example.com",
          },
          created_at: "2026-05-03T08:00:00.000Z",
          summary: {},
          total: 2500,
        },
      ],
      count: 2,
      offset: 0,
      limit: 100,
    })))

  beforeEach(() => {
    vi.stubEnv("VITE_MEDUSA_ADMIN_BACKEND_URL", "http://localhost:9000")
    globalThis.fetch = fetchSpy as unknown as typeof fetch
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    cleanup()
    vi.restoreAllMocks()
  })

  it("renders order rows from mocked admin orders response", async () => {
    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <Routes>
          <Route path="/orders" element={<OrdersListPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByRole("table", { name: /orders list/i })).toBeInTheDocument()

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())

    expect(await screen.findByRole("link", { name: /#1001/ })).toBeInTheDocument()
    expect(screen.getByRole("cell", { name: /ada@example.com/i })).toBeInTheDocument()
    expect(screen.getByRole("cell", { name: /Ada Lovelace/ })).toBeInTheDocument()
    const rawCalls = fetchSpy.mock.calls as unknown as Parameters<typeof fetch>[]
    const urlsFromCalls = rawCalls
      .map((args) => args[0])
      .filter((u): u is string => typeof u === "string")
    expect(
      urlsFromCalls.some(
        (url) =>
          url.includes("http://localhost:9000/admin/orders") &&
          url.includes("limit=")
      ),
    ).toBe(true)
  })
})

function orderDetailGetMatches(urlStr: string, orderId: string): boolean {
  const expectedPath = `/admin/orders/${encodeURIComponent(orderId)}`
  try {
    const u = new URL(urlStr)
    return u.pathname.endsWith(expectedPath)
  } catch {
    const pathOnly = urlStr.split("?")[0] ?? urlStr
    return pathOnly.endsWith(expectedPath)
  }
}

describe("OrderDetailPage", () => {
  const fetchSpy = vi.fn(
    async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === "string" ? input : input.toString()
      if (orderDetailGetMatches(url, "ord_test")) {
        return jsonResponse({
          order: {
            ...sampleOrderPayload,
            fulfillments: [
              {
                created_at: "2026-05-02T07:15:00.000Z",
                shipped_at: "2026-05-03T06:30:00.000Z",
                delivered_at: "2026-05-04T09:05:00.000Z",
              },
            ],
            fulfillment_status: "delivered",
            payment_status: "captured",
          },
        })
      }
      return jsonResponse({}, 404)
    }
  )

  beforeEach(() => {
    vi.stubEnv("VITE_MEDUSA_ADMIN_BACKEND_URL", "http://localhost:9000")
    globalThis.fetch = fetchSpy as unknown as typeof fetch
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    cleanup()
    vi.restoreAllMocks()
  })

  it("renders detail sections and timeline from mocked order response", async () => {
    render(
      <MemoryRouter initialEntries={["/orders/ord_test"]}>
        <Routes>
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByRole("heading", { name: /Order #1001/ })).toBeInTheDocument()
    expect(
      screen.getByRole("region", { name: "Order fulfillment actions" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Line items" })).toBeInTheDocument()
    expect(screen.getByText("Sample SKU")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Status timeline" })).toBeInTheDocument()
    expect(screen.getByRole("list", { name: "Order status timeline" })).toBeInTheDocument()
  })
})
