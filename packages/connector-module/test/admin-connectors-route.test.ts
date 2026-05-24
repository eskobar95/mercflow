import { describe, expect, it, vi } from "vitest"

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import type { ConnectorAdminListItem } from "../src/modules/connector/types"

import { GET } from "../src/api/admin/connectors/route"

describe("GET /admin/connectors route", (): void => {
  it("returns HTTP 200 and a connectors array matching the summary contract", async (): Promise<void> => {
    const sampleRows: ConnectorAdminListItem[] = [
      {
        type: "shipmondo",
        active: false,
        lastTestedAt: null,
        configured: false,
      },
      {
        type: "stripe",
        active: true,
        lastTestedAt: "2026-05-01T10:00:00.000Z",
        configured: true,
      },
      {
        type: "plunk",
        active: false,
        lastTestedAt: null,
        configured: false,
      },
      {
        type: "gtm",
        active: false,
        lastTestedAt: null,
        configured: false,
      },
    ]

    const listConnectorsForAdmin = vi.fn(
      async (): Promise<ConnectorAdminListItem[]> => sampleRows
    )

    const req = {
      scope: {
        resolve: vi.fn().mockReturnValue({
          listConnectorsForAdmin,
        }),
      },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { status, json } as unknown as MedusaResponse

    await GET(req, res)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ connectors: sampleRows })

    const payloadCall = json.mock.calls[0]?.[0]
    expect(payloadCall).toBeDefined()
    const payload = payloadCall as { connectors: unknown }
    expect(Array.isArray(payload.connectors)).toBe(true)

    const connectors = payload.connectors as ConnectorAdminListItem[]
    expect(connectors).toHaveLength(4)

    const first = connectors[0]
    expect(first).toBeDefined()
    expect(first).toMatchObject({
      type: expect.any(String),
      active: expect.any(Boolean),
      configured: expect.any(Boolean),
    })
    expect(
      first!.lastTestedAt === null || typeof first!.lastTestedAt === "string"
    ).toBe(true)
    expect(["shipmondo", "stripe", "plunk", "gtm"]).toContain(first!.type)

    expect(listConnectorsForAdmin).toHaveBeenCalledTimes(1)
  })
})
