import { describe, expect, it } from "vitest"

import {
  buildConnectorAdminList,
  resolveConnectorAppStatus,
} from "../src/modules/connector/build-connector-admin-list"

describe("buildConnectorAdminList", (): void => {
  it("marks missing rows as not configured with neutral defaults", (): void => {
    const list = buildConnectorAdminList([])
    expect(list).toHaveLength(4)
    for (const row of list) {
      expect(row.configured).toBe(false)
      expect(row.active).toBe(false)
      expect(row.lastTestedAt).toBeNull()
      expect(row.connectionHealth).toBeNull()
      expect(row.status).toBe("not_configured")
    }
    expect(list.map((r) => r.type).sort()).toEqual(["gtm", "plunk", "shipmondo", "stripe"])
  })

  it("maps a stored row with correct configured + active + iso timestamp", (): void => {
    const list = buildConnectorAdminList([
      {
        id: "cfg_1",
        type: "stripe",
        credentials_encrypted: "mf1:dummy",
        active: true,
        last_tested_at: new Date("2026-05-20T12:00:00.000Z"),
        vat_mode: "inclusive",
        secret_key_last4: null,
        publishable_key_last4: null,
        webhook_secret_last4: null,
        connection_status: "ok",
        last_test_message: "ok",
        rules_json: null,
      },
    ])
    const stripe = list.find((c) => c.type === "stripe")
    expect(stripe?.configured).toBe(true)
    expect(stripe?.active).toBe(true)
    expect(stripe?.lastTestedAt).toBe("2026-05-20T12:00:00.000Z")
    expect(stripe?.connectionHealth).toBe("ok")
    expect(stripe?.status).toBe("not_configured")
    const shipmondo = list.find((c) => c.type === "shipmondo")
    expect(shipmondo?.configured).toBe(false)
  })

  it("treats configured but inactive as inactive", (): void => {
    const list = buildConnectorAdminList([
      {
        id: "cfg_2",
        type: "shipmondo",
        credentials_encrypted: "mf1:x",
        active: false,
        last_tested_at: null,
        vat_mode: "inclusive",
        secret_key_last4: null,
        publishable_key_last4: null,
        webhook_secret_last4: null,
        connection_status: null,
        last_test_message: null,
        rules_json: null,
      },
    ])
    const row = list.find((c) => c.type === "shipmondo")
    expect(row?.configured).toBe(true)
    expect(row?.active).toBe(false)
    expect(row?.lastTestedAt).toBeNull()
    expect(row?.connectionHealth).toBe("untested")
    expect(row?.status).toBe("not_configured")
  })

  it("maps stored probe error to error status", (): void => {
    const list = buildConnectorAdminList([
      {
        id: "cfg_3",
        type: "plunk",
        credentials_encrypted: "mf1:x",
        active: true,
        last_tested_at: new Date("2026-05-20T12:00:00.000Z"),
        vat_mode: "inclusive",
        secret_key_last4: null,
        publishable_key_last4: null,
        webhook_secret_last4: null,
        connection_status: "error",
        last_test_message: "401",
        rules_json: null,
      },
    ])
    const plunk = list.find((c) => c.type === "plunk")
    expect(plunk?.status).toBe("error")
  })

  it("resolveConnectorAppStatus returns connected when verified within 24h", (): void => {
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
