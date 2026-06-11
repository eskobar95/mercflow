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

const largePackagingType = {
  id: "pkg_large",
  store_id: "store_1",
  name: "Large box",
  type: "box",
  length_mm: 500,
  width_mm: 400,
  height_mm: 300,
  max_weight_g: 5_000,
  is_active: true,
  created_at: "2026-06-10T12:00:00.000Z",
  updated_at: "2026-06-10T12:00:00.000Z",
  deleted_at: null,
}

const orderLineItem = {
  id: "oli_1",
  title: "Sized item",
  variant_id: "variant_1",
  quantity: 1,
  unit_price: 1000,
  total: 1000,
}

function orderWithFulfillment(orderId: string): Record<string, unknown> {
  return {
    id: orderId,
    display_id: 4200,
    status: "pending",
    payment_status: "captured",
    fulfillment_status: "not_fulfilled",
    email: "pack@example.com",
    currency_code: "dkk",
    items: [orderLineItem],
    payment_collections: [{ payments: [{ id: "pay_1", status: "captured" }] }],
    fulfillments: [
      {
        id: "ful_1",
        items: [{ id: "fuli_1", line_item_id: "oli_1", quantity: 1 }],
      },
    ],
    summary: {},
    created_at: "2026-06-10T10:00:00.000Z",
    updated_at: "2026-06-10T10:00:00.000Z",
    total: 1000,
  }
}

function shipmentPackagingPayload(packagingTypeId: string, snapshotName: string): Record<string, unknown> {
  const type = packagingTypeId === "pkg_large" ? largePackagingType : samplePackagingType
  return {
    shipment_packaging: {
      id: "sp_1",
      store_id: "store_1",
      fulfillment_id: "ful_1",
      packaging_type_id: packagingTypeId,
      dimensions_snapshot_json: {
        name: snapshotName,
        length_mm: type.length_mm,
        width_mm: type.width_mm,
        height_mm: type.height_mm,
        max_weight_g: type.max_weight_g,
      },
      created_at: "2026-06-10T12:00:00.000Z",
      updated_at: "2026-06-10T12:00:00.000Z",
      deleted_at: null,
    },
  }
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
    expect(screen.getByText(/Order weight/)).toHaveTextContent("500 g")
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
      "/settings/shipping/packaging",
    )
  })

  it("restores persisted packaging before applying a fresh suggestion", async () => {
    const requestOrder: string[] = []
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === "string" ? input : input.toString()
      requestOrder.push(`${init?.method ?? "GET"} ${url}`)
      if (url.includes("/admin/orders/ord_restore")) {
        return jsonResponse({ order: orderWithFulfillment("ord_restore") })
      }
      if (url.includes("/admin/fulfillments/ful_1/shipment-packaging") && init?.method !== "PUT") {
        return jsonResponse(shipmentPackagingPayload("pkg_large", "Large box"))
      }
      if (url.endsWith("/admin/packaging-types/suggest") && init?.method === "POST") {
        return jsonResponse({
          suggested: samplePackagingType,
          total_volume_mm3: 6_000_000,
          total_weight_g: 500,
        })
      }
      return jsonResponse({}, 404)
    })
    globalThis.fetch = fetchSpy as unknown as typeof fetch

    render(
      <MemoryRouter initialEntries={["/orders/ord_restore"]}>
        <Routes>
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText("Large box")).toBeInTheDocument()
    expect(screen.queryByText("Small box")).not.toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Order fulfillment" })).toHaveAttribute(
      "data-confirmed-packaging-type-id",
      "pkg_large",
    )

    const getPersistedIndex = requestOrder.findIndex((entry) =>
      entry.includes("GET") && entry.includes("/shipment-packaging"),
    )
    const suggestIndex = requestOrder.findIndex((entry) => entry.includes("/packaging-types/suggest"))
    expect(getPersistedIndex).toBeGreaterThanOrEqual(0)
    expect(suggestIndex).toBeGreaterThan(getPersistedIndex)
  })

  it("auto-persists initial suggestion when fulfillment exists", async () => {
    const putBodies: string[] = []
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === "string" ? input : input.toString()
      if (url.includes("/admin/orders/ord_save")) {
        return jsonResponse({ order: orderWithFulfillment("ord_save") })
      }
      if (url.includes("/admin/fulfillments/ful_1/shipment-packaging")) {
        if (init?.method === "PUT") {
          putBodies.push(String(init.body))
          return jsonResponse(shipmentPackagingPayload("pkg_small", "Small box"))
        }
        return jsonResponse({}, 404)
      }
      if (url.endsWith("/admin/packaging-types/suggest") && init?.method === "POST") {
        return jsonResponse({
          suggested: samplePackagingType,
          total_volume_mm3: 6_000_000,
          total_weight_g: 500,
        })
      }
      return jsonResponse({}, 404)
    })
    globalThis.fetch = fetchSpy as unknown as typeof fetch

    render(
      <MemoryRouter initialEntries={["/orders/ord_save"]}>
        <Routes>
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText("Small box")).toBeInTheDocument()
    await waitFor(() => {
      expect(putBodies.length).toBeGreaterThanOrEqual(1)
    })
    expect(JSON.parse(putBodies[0] ?? "{}")).toEqual({ packaging_type_id: "pkg_small" })
    expect(screen.getByRole("region", { name: "Order fulfillment" })).toHaveAttribute(
      "data-confirmed-packaging-type-id",
      "pkg_small",
    )
  })
})
