import { describe, expect, it, vi } from "vitest"

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { GET as GETCarriers } from "../src/api/admin/connectors/shipmondo/carriers/route"
import { PATCH as PATCHRules } from "../src/api/admin/connectors/shipmondo/rules/route"
import { GET as GETStoreRules } from "../src/api/store/connectors/shipmondo/rules/route"

describe("Shipmondo carriers + rules admin routes", (): void => {
  it("GET /admin/connectors/shipmondo/carriers delegates to service with optional country filter", async (): Promise<void> => {
    const fetchShipmondoCarrierProducts = vi.fn(
      async (): Promise<
        Array<{
          productCode: string
          carrierCode: string | null
          name: string
          basePriceMinor: number
        }>
      > => [
        {
          productCode: "PN_STD",
          carrierCode: "postnord",
          name: "PostNord",
          basePriceMinor: 4900,
        },
      ]
    )

    const req = {
      query: { country_code: "dk" },
      scope: {
        resolve: vi.fn().mockReturnValue({
          fetchShipmondoCarrierProducts,
        }),
      },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { status, json } as unknown as MedusaResponse

    await GETCarriers(req, res)

    expect(fetchShipmondoCarrierProducts).toHaveBeenCalledWith({ countryCode: "DK" })
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      data: [
        {
          productCode: "PN_STD",
          carrierCode: "postnord",
          name: "PostNord",
          basePriceMinor: 4900,
        },
      ],
      count: 1,
      limit: 50,
      offset: 0,
    })
  })

  it("PATCH /admin/connectors/shipmondo/rules validates Zod before persisting", async (): Promise<void> => {
    const patchShipmondoShippingRules = vi.fn(async () => ({
      markupAmountMinor: 100,
      freeShippingThresholdMinor: 50_000,
      enabledCarrierCodes: ["PN_STD"],
    }))

    const req = {
      body: {
        markupAmountMinor: 100,
        freeShippingThresholdMinor: 50000,
        enabledCarrierCodes: ["PN_STD"],
      },
      scope: {
        resolve: vi.fn().mockReturnValue({
          patchShipmondoShippingRules,
        }),
      },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { json, status } as unknown as MedusaResponse

    await PATCHRules(req, res)

    expect(patchShipmondoShippingRules).toHaveBeenCalledTimes(1)
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      data: {
        markupAmountMinor: 100,
        freeShippingThresholdMinor: 50_000,
        enabledCarrierCodes: ["PN_STD"],
      },
    })
  })

  it("PATCH /admin/connectors/shipmondo/rules rejects malformed payloads via Zod", async (): Promise<void> => {
    const patchShipmondoShippingRules = vi.fn()

    const req = {
      body: {
        markupAmountMinor: "oops",
      },
      scope: {
        resolve: vi.fn().mockReturnValue({
          patchShipmondoShippingRules,
        }),
      },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { json, status } as unknown as MedusaResponse

    await expect(PATCHRules(req, res)).rejects.toMatchObject({
      type: "invalid_data",
    })

    expect(patchShipmondoShippingRules).not.toHaveBeenCalled()
  })
})

describe("Shipmondo store shipping rules route", (): void => {
  it("returns connector shipping rules for public storefront consumers", async (): Promise<void> => {
    const getShipmondoStoreShippingRules = vi.fn(
      async (): Promise<{
        active: boolean
        markupAmountMinor: number
        freeShippingThresholdMinor: number
        enabledCarrierCodes: string[]
      }> => ({
        active: true,
        markupAmountMinor: 0,
        freeShippingThresholdMinor: 0,
        enabledCarrierCodes: [],
      })
    )

    const req = {
      scope: {
        resolve: vi.fn().mockReturnValue({
          getShipmondoStoreShippingRules,
        }),
      },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { status, json } as unknown as MedusaResponse

    await GETStoreRules(req, res)

    expect(getShipmondoStoreShippingRules).toHaveBeenCalledTimes(1)
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      data: {
        active: true,
        markupAmountMinor: 0,
        freeShippingThresholdMinor: 0,
        enabledCarrierCodes: [],
      },
    })
  })
})
