import { describe, expect, it, vi } from "vitest"

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import * as StoreGtmRoute from "../src/api/store/connectors/gtm/route"

describe("GET /store/connectors/gtm", () => {
  it("is marked unauthenticated via AUTHENTICATE flag", (): void => {
    expect(StoreGtmRoute.AUTHENTICATE).toBe(false)
  })

  it("returns public container payload", async () => {
    const gtm = vi.fn(() => ({
      get: vi.fn().mockResolvedValue("GTM-PUBLIC1"),
    }))

    const req = {
      scope: {
        resolve: vi.fn().mockReturnValue({ gtm }),
      },
      body: {},
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { status, json } as unknown as MedusaResponse

    await StoreGtmRoute.GET(req, res)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ container_id: "GTM-PUBLIC1" })
  })
})
