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
        connectionHealth: null,
        status: "not_configured",
      },
      {
        type: "plunk",
        active: true,
        lastTestedAt: "2026-05-01T10:00:00.000Z",
        configured: true,
        connectionHealth: "ok",
        status: "connected",
      },
      {
        type: "gtm",
        active: false,
        lastTestedAt: null,
        configured: false,
        connectionHealth: null,
        status: "not_configured",
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
    expect(listConnectorsForAdmin).toHaveBeenCalledTimes(1)
  })
})
