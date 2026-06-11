import { describe, expect, it, vi } from "vitest"

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

vi.mock("../../api/admin/enrich-subscriptions.js", () => ({
  enrichSubscriptionsForAdmin: vi.fn(),
}))

import { enrichSubscriptionsForAdmin } from "../../api/admin/enrich-subscriptions.js"
import { GET } from "../../api/admin/subscriptions/route.js"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"

describe("GET /admin/subscriptions route", (): void => {
  it("returns paginated enriched rows and forwards listSubscriptions config", async (): Promise<void> => {
    const rows = [
      {
        id: "sub_1",
        store_id: STORE_A,
        customer_id: "cus_1",
        product_id: "prod_1",
        variant_id: "variant_1",
        interval: "monthly" as const,
        status: "active" as const,
        stripe_subscription_id: null,
        current_period_start: "2026-06-01T00:00:00.000Z",
        current_period_end: "2026-07-01T00:00:00.000Z",
        next_renewal_at: "2026-07-01T00:00:00.000Z",
        cancelled_at: null,
        pause_requested_at: null,
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
        deleted_at: null,
      },
    ]

    const listSubscriptions = vi.fn().mockResolvedValue({ subscriptions: rows, count: 1 })

    vi.mocked(enrichSubscriptionsForAdmin).mockResolvedValue([
      {
        customer_display: "Ada Lovelace",
        product_label: "Tea — Monthly",
      },
    ])

    const req = {
      query: { limit: 20, offset: 5, store_id: STORE_A },
      scope: {
        resolve: vi.fn().mockReturnValue({
          listSubscriptions,
        }),
      },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { status, json } as unknown as MedusaResponse

    await GET(req, res)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          id: "sub_1",
          interval: "monthly",
          customer_display: "Ada Lovelace",
          product_label: "Tea — Monthly",
        }),
      ],
      count: 1,
      limit: 20,
      offset: 5,
    })

    expect(listSubscriptions).toHaveBeenCalledWith(
      STORE_A,
      {},
      expect.objectContaining({
        offset: 5,
        limit: 20,
      })
    )

    expect(enrichSubscriptionsForAdmin).toHaveBeenCalledWith(req.scope, rows)
  })

  it("rejects invalid query with 400 envelope", async (): Promise<void> => {
    const req = {
      query: { limit: -1, store_id: STORE_A },
      scope: {
        resolve: vi.fn(),
      },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { status, json } as unknown as MedusaResponse

    await expect(GET(req, res)).rejects.toMatchObject({
      type: "invalid_data",
    })
  })
})
