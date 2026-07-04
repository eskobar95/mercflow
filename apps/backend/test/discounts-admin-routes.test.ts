import { describe, expect, it, vi } from "vitest"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { GET, POST } from "../src/api/admin/discounts/route"
import {
  enrichPromotionToDiscountDetail,
  enrichPromotionToDiscountRow,
  resolveDiscountMethodLabel,
  resolveDiscountStatus,
  resolveDiscountTypeLabel,
} from "../src/lib/discounts/enrichment"
import * as promotionService from "../src/lib/discounts/promotion-service"
import { resolveMercflowStoreId } from "../src/lib/discounts/resolve-store-id"

const STORE_ID = "store_01KG0VBTT0714XV2CCTEBRVC47"

describe("discount enrichment", (): void => {
  it("maps product promotion to Product type label", (): void => {
    expect(
      resolveDiscountTypeLabel({
        id: "promo_1",
        type: "standard",
        application_method: { target_type: "items" },
      }),
    ).toBe("Product")
  })

  it("maps free shipping promotion", (): void => {
    expect(
      resolveDiscountTypeLabel({
        id: "promo_1",
        type: "standard",
        application_method: { target_type: "shipping_methods" },
      }),
    ).toBe("Free shipping")
  })

  it("maps buyget promotion", (): void => {
    expect(
      resolveDiscountTypeLabel({
        id: "promo_1",
        type: "buyget",
        application_method: { target_type: "items" },
      }),
    ).toBe("Buy X get Y")
  })

  it("derives method label from is_automatic", (): void => {
    expect(resolveDiscountMethodLabel(true)).toBe("Automatic")
    expect(resolveDiscountMethodLabel(false)).toBe("Code")
  })

  it("marks expired discounts when campaign ends_at is in the past", (): void => {
    expect(
      resolveDiscountStatus("active", "2020-01-01T00:00:00.000Z"),
    ).toBe("expired")
  })

  it("enriches list row with usage and store_id", (): void => {
    const row = enrichPromotionToDiscountRow(STORE_ID, {
      id: "promo_1",
      code: "WEEKEND10",
      type: "standard",
      status: "active",
      is_automatic: false,
      limit: 500,
      used: 12,
      application_method: { target_type: "order" },
      campaign: { name: "Weekend sale", ends_at: "2026-12-31T23:59:59.000Z" },
    })

    expect(row).toMatchObject({
      store_id: STORE_ID,
      name: "Weekend sale",
      type: "Order",
      method: "Code",
      usage_count: 12,
      usage_limit: 500,
    })
  })

  it("enriches detail with raw promotion status", (): void => {
    const detail = enrichPromotionToDiscountDetail(
      STORE_ID,
      {
        id: "promo_1",
        code: "AUTO10",
        type: "standard",
        status: "active",
        is_automatic: true,
        application_method: { target_type: "items" },
      },
      "dkk",
    )

    expect(detail.raw_status).toBe("active")
    expect(detail.is_automatic).toBe(true)
  })
})

describe("resolveMercflowStoreId", (): void => {
  it("prefers JWT org_id from mercflowStoreId", (): void => {
    const req = { query: {}, headers: {}, mercflowStoreId: STORE_ID } as MedusaRequest & {
      mercflowStoreId: string
    }
    expect(resolveMercflowStoreId(req)).toBe(STORE_ID)
  })

  it("throws when no store context is available", (): void => {
    const previous = process.env.MERCFLOW_DEFAULT_STORE_ID
    delete process.env.MERCFLOW_DEFAULT_STORE_ID

    expect(() => resolveMercflowStoreId({ query: {}, headers: {} } as MedusaRequest)).toThrow(
      MedusaError,
    )

    process.env.MERCFLOW_DEFAULT_STORE_ID = previous
  })
})

function mockReq(overrides: Partial<MedusaRequest> = {}): MedusaRequest {
  return {
    query: {},
    body: {},
    headers: {},
    scope: {
      resolve: vi.fn(),
    },
    ...overrides,
  } as unknown as MedusaRequest
}

describe("GET /admin/discounts", (): void => {
  it("returns enriched discount rows", async (): Promise<void> => {
    process.env.MERCFLOW_DEFAULT_STORE_ID = STORE_ID

    vi.spyOn(promotionService, "listPromotions").mockResolvedValue({
      promotions: [
        {
          id: "promo_1",
          code: "SAVE10",
          type: "standard",
          status: "active",
          is_automatic: false,
          limit: 100,
          used: 3,
          application_method: { target_type: "order" },
        },
      ],
      count: 1,
    })

    const req = mockReq({ query: { limit: "20", offset: "0" } })
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const res = { status, json } as unknown as MedusaResponse

    await GET(req, res)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 1,
        data: [
          expect.objectContaining({
            store_id: STORE_ID,
            name: "SAVE10",
            type: "Order",
            method: "Code",
          }),
        ],
      }),
    )
  })
})

describe("POST /admin/discounts", (): void => {
  it("validates body with Zod", async (): Promise<void> => {
    process.env.MERCFLOW_DEFAULT_STORE_ID = STORE_ID

    const req = mockReq({
      body: {
        name: "Weekend",
        discount_type: "order",
        method: "code",
      },
    })

    await expect(
      POST(req, { status: vi.fn(() => ({ json: vi.fn() })) } as unknown as MedusaResponse),
    ).rejects.toThrow(MedusaError)
  })
})
