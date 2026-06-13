import { describe, expect, it } from "vitest"

import {
  buildConnectorAdminList,
  resolveConnectorAppStatus,
} from "../src/modules/connector/build-connector-admin-list"

describe("buildConnectorAdminList", (): void => {
  it("marks missing rows as not configured with neutral defaults", (): void => {
    const list = buildConnectorAdminList([])
    expect(list).toHaveLength(3)
    expect(list.map((r) => r.type).sort()).toEqual(["gtm", "plunk", "shipmondo"])
  })

  it("maps a stored row with correct configured + active + iso timestamp", (): void => {
    const list = buildConnectorAdminList([
      {
        id: "cfg_1",
        type: "plunk",
        credentials_encrypted: "mf1:dummy",
        active: true,
        last_tested_at: new Date("2026-05-20T12:00:00.000Z"),
        connection_status: "ok",
        last_test_message: "ok",
        rules_json: null,
      },
    ])
    const plunk = list.find((c) => c.type === "plunk")
    expect(plunk?.configured).toBe(true)
    expect(plunk?.active).toBe(true)
    expect(plunk?.lastTestedAt).toBe("2026-05-20T12:00:00.000Z")
  })
})

describe("resolveConnectorAppStatus", (): void => {
  it("returns connected when verified within 24h", (): void => {
    const now = new Date("2026-05-21T10:00:00.000Z")
    expect(
      resolveConnectorAppStatus({
        configured: true,
        connectionHealth: "ok",
        lastTestedAt: "2026-05-20T12:00:00.000Z",
        now,
      })
    ).toBe("connected")
  })
})
