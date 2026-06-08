import { describe, expect, it, vi } from "vitest"

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { GET, PATCH } from "../src/api/admin/connectors/gtm/route"

describe("GET /admin/connectors/gtm", () => {
  it("returns container_id read from module service", async () => {
    const gtm = vi.fn(() => ({
      get: vi.fn().mockResolvedValue("GTM-ABC123"),
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

    await GET(req, res)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ container_id: "GTM-ABC123" })
  })

  it("allows null container_id when not configured", async () => {
    const gtm = vi.fn(() => ({
      get: vi.fn().mockResolvedValue(null),
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

    await GET(req, res)

    expect(json).toHaveBeenCalledWith({ container_id: null })
  })
})

describe("PATCH /admin/connectors/gtm", () => {
  it("returns 400 for invalid container_id", async (): Promise<void> => {
    const gtmMock = vi.fn()
    const req = {
      scope: {
        resolve: vi.fn().mockReturnValue({ gtm: gtmMock }),
      },
      body: { container_id: "not-a-container" },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { status, json } as unknown as MedusaResponse

    await expect(PATCH(req, res)).rejects.toMatchObject({
      type: "invalid_data",
    })

    expect(gtmMock).not.toHaveBeenCalled()
  })

  it("normalizes casing, saves via service, echoes stored id", async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const get = vi.fn().mockResolvedValue("GTM-ABC123")
    const gtmBridge = { save, get }

    const gtm = vi.fn(() => gtmBridge)

    const req = {
      scope: {
        resolve: vi.fn().mockReturnValue({ gtm }),
      },
      body: { container_id: "gtm-abc123" },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { status, json } as unknown as MedusaResponse

    await PATCH(req, res)

    expect(save).toHaveBeenCalledWith("GTM-ABC123")
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ container_id: "GTM-ABC123" })
  })
})
