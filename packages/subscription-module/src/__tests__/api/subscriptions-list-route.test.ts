import { describe, expect, it, vi } from "vitest"

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

vi.mock("../../api/admin/enrich-subscriptions.js", () => ({
  enrichSubscriptionsForAdmin: vi.fn(),
}))

import { enrichSubscriptionsForAdmin } from "../../api/admin/enrich-subscriptions.js"
import { GET } from "../../api/admin/subscriptions/route.js"

describe("GET /admin/subscriptions route", (): void => {
  it("returns paginated enriched rows and forwards listAndCount config", async (): Promise<void> => {
    const rows = [
      {
        id: "sub_1",
        customer_id: "cus_1",
        status: "active",
        cycle_weeks: 4,
        next_renewal_at: null,
        variant_id: "variant_1",
        discount_percent: 10,
      },
    ]

    const listAndCountSubscriptions = vi.fn(
      async (): Promise<[typeof rows, number]> => [rows, 1]
    )

    vi.mocked(enrichSubscriptionsForAdmin).mockResolvedValue([
      {
        id: "sub_1",
        customer_id: "cus_1",
        status: "active",
        cycle_weeks: 4,
        next_renewal_at: null,
        variant_id: "variant_1",
        discount_percent: 10,
        customer_display: "Ada Lovelace",
        product_label: "Tea — Monthly",
      },
    ])

    const req = {
      query: { limit: 20, offset: 5 },
      scope: {
        resolve: vi.fn().mockReturnValue({
          listAndCountSubscriptions,
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
          customer_display: "Ada Lovelace",
          product_label: "Tea — Monthly",
        }),
      ],
      count: 1,
      limit: 20,
      offset: 5,
    })

    expect(listAndCountSubscriptions).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        skip: 5,
        take: 20,
        order: { next_renewal_at: "ASC" },
      })
    )

    expect(enrichSubscriptionsForAdmin).toHaveBeenCalledWith(req.scope, rows)
  })

  it("rejects invalid query with 400 envelope", async (): Promise<void> => {
    const req = {
      query: { limit: -1 },
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
