import { describe, expect, it, vi } from "vitest"

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { POST } from "../src/api/admin/connectors/plunk/test/route"
import { GET, PATCH } from "../src/api/admin/connectors/plunk/route"

describe("Plunk admin routes", (): void => {
  it("GET returns dto wrapped in data", async (): Promise<void> => {
    const stub = vi.fn(async () => ({
      type: "plunk" as const,
      configured: false,
      active: false,
      apiKeyMasked: null,
      fromEmail: null,
      fromName: null,
      connectionHealth: null,
      lastTestedAt: null,
      lastTestMessage: null,
    }))

    const req = {
      scope: {
        resolve: vi.fn().mockReturnValue({ getPlunkConnectorForAdmin: stub }),
      },
      body: {},
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { status, json } as unknown as MedusaResponse

    await GET(req, res)

    expect(status).toHaveBeenCalledWith(200)
    expect(json.mock.calls[0]?.[0]).toEqual({
      data: expect.objectContaining({ type: "plunk", configured: false }),
    })
  })

  it("PATCH rejects invalid payloads with HTTP 400", async (): Promise<void> => {
    const upsert = vi.fn()
    const req = {
      scope: {
        resolve: vi.fn().mockReturnValue({ upsertPlunkCredentials: upsert }),
      },
      body: { api_key: "" },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { status, json } as unknown as MedusaResponse

    await expect(PATCH(req, res)).rejects.toMatchObject({
      type: "invalid_data",
    })

    expect(upsert).not.toHaveBeenCalled()
  })

  it("POST test forwards body to runner", async (): Promise<void> => {
    const run = vi.fn(async () => ({ success: true, message: "ok" }))

    const req = {
      scope: {
        resolve: vi.fn().mockReturnValue({ runPlunkConnectionTest: run }),
      },
      body: { test_email: "friend@example.com" },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { status, json } as unknown as MedusaResponse

    await POST(req, res)

    expect(run).toHaveBeenCalledWith({ test_email: "friend@example.com" })
    expect(status).toHaveBeenCalledWith(200)
  })
})
