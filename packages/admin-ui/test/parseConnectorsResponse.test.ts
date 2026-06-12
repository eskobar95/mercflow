import { describe, expect, it } from "vitest"

import { parseConnectorsResponse } from "@/features/connectors/parseConnectorsResponse"

describe("parseConnectorsResponse", (): void => {
  it("parses connector list items including status field", (): void => {
    const parsed = parseConnectorsResponse({
      connectors: [
        {
          type: "shipmondo",
          active: false,
          configured: false,
          lastTestedAt: null,
          connectionHealth: null,
          status: "not_configured",
        },
        {
          type: "stripe",
          active: true,
          configured: true,
          lastTestedAt: "2026-05-01T10:00:00.000Z",
          connectionHealth: "ok",
          status: "connected",
        },
        {
          type: "plunk",
          active: false,
          configured: false,
          lastTestedAt: null,
          connectionHealth: null,
          status: "not_configured",
        },
        {
          type: "gtm",
          active: false,
          configured: false,
          lastTestedAt: null,
          connectionHealth: null,
          status: "not_configured",
        },
      ],
    })

    expect(parsed).not.toBeNull()
    expect(parsed?.find((c) => c.type === "stripe")?.status).toBe("connected")
  })

  it("rejects payloads missing status", (): void => {
    const parsed = parseConnectorsResponse({
      connectors: [
        {
          type: "shipmondo",
          active: false,
          configured: false,
          lastTestedAt: null,
          connectionHealth: null,
        },
        {
          type: "stripe",
          active: true,
          configured: true,
          lastTestedAt: null,
          connectionHealth: "ok",
          status: "connected",
        },
        {
          type: "plunk",
          active: false,
          configured: false,
          lastTestedAt: null,
          connectionHealth: null,
          status: "not_configured",
        },
        {
          type: "gtm",
          active: false,
          configured: false,
          lastTestedAt: null,
          connectionHealth: null,
          status: "not_configured",
        },
      ],
    })

    expect(parsed).toBeNull()
  })
})
