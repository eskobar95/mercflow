import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  fetchShipmentPackaging,
  packagingTypeFromShipmentPackaging,
  upsertShipmentPackaging,
} from "@/features/packaging/packagingAdminApi"

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("packagingAdminApi shipment-packaging", (): void => {
  beforeEach(() => {
    vi.stubEnv("VITE_MEDUSA_ADMIN_BACKEND_URL", "http://localhost:9000")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it("returns null when shipment packaging is not persisted", async () => {
    globalThis.fetch = vi.fn(async (): Promise<Response> => jsonResponse({}, 404)) as typeof fetch

    await expect(fetchShipmentPackaging("ful_missing")).resolves.toBeNull()
  })

  it("parses persisted shipment packaging and maps snapshot to display type", async () => {
    globalThis.fetch = vi.fn(async (): Promise<Response> =>
      jsonResponse({
        shipment_packaging: {
          id: "sp_1",
          store_id: "store_1",
          fulfillment_id: "ful_1",
          packaging_type_id: "pkg_large",
          dimensions_snapshot_json: {
            name: "Large box",
            length_mm: 500,
            width_mm: 400,
            height_mm: 300,
            max_weight_g: 5_000,
          },
          created_at: "2026-06-10T12:00:00.000Z",
          updated_at: "2026-06-10T12:00:00.000Z",
          deleted_at: null,
        },
      }),
    ) as typeof fetch

    const row = await fetchShipmentPackaging("ful_1")
    expect(row?.packaging_type_id).toBe("pkg_large")
    expect(packagingTypeFromShipmentPackaging(row!)).toMatchObject({
      id: "pkg_large",
      name: "Large box",
      length_mm: 500,
    })
  })

  it("upserts shipment packaging with packaging_type_id body", async () => {
    const fetchSpy = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      expect(init?.method).toBe("PUT")
      expect(JSON.parse(String(init?.body))).toEqual({ packaging_type_id: "pkg_small" })
      return jsonResponse({
        shipment_packaging: {
          id: "sp_1",
          store_id: "store_1",
          fulfillment_id: "ful_1",
          packaging_type_id: "pkg_small",
          dimensions_snapshot_json: {
            name: "Small box",
            length_mm: 300,
            width_mm: 200,
            height_mm: 150,
            max_weight_g: 2_000,
          },
          created_at: "2026-06-10T12:00:00.000Z",
          updated_at: "2026-06-10T12:00:00.000Z",
          deleted_at: null,
        },
      })
    })
    globalThis.fetch = fetchSpy as unknown as typeof fetch

    const row = await upsertShipmentPackaging("ful_1", "pkg_small")
    expect(row.packaging_type_id).toBe("pkg_small")
  })
})
