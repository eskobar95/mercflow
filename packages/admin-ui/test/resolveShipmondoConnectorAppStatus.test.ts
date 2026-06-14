import { describe, expect, it } from "vitest"

import { resolveShipmondoConnectorAppStatus } from "@/features/connectors/resolveShipmondoConnectorAppStatus"
import type { ShipmondoConnectorGetDto } from "@/features/connectors/shipmondoTypes"

function snapshot(overrides: Partial<ShipmondoConnectorGetDto> = {}): ShipmondoConnectorGetDto {
  return {
    type: "shipmondo",
    active: true,
    lastTestedAt: null,
    credentials: { apiUserConfigured: true, apiKeyConfigured: true, shippingModuleKeyConfigured: false },
    recentLogs: [],
    shippingRules: { markupAmountMinor: 0, freeShippingThresholdMinor: 0, enabledCarrierCodes: [] },
    labelSettings: {
      senderName: "",
      senderAddress1: "",
      senderPostalCode: "",
      senderCity: "",
      senderCountryCode: "DK",
      senderEmail: "",
      senderPhone: "",
      labelFormat: "10x19_pdf",
      ownAgreement: false,
    },
    ...overrides,
  }
}

describe("resolveShipmondoConnectorAppStatus", () => {
  it("returns not_configured without credentials", () => {
    expect(
      resolveShipmondoConnectorAppStatus(
        snapshot({ credentials: { apiUserConfigured: false, apiKeyConfigured: false, shippingModuleKeyConfigured: false } }),
      ),
    ).toBe("not_configured")
  })

  it("returns connected after a recent successful probe", () => {
    const now = new Date("2026-06-14T12:00:00.000Z")
    expect(
      resolveShipmondoConnectorAppStatus(
        snapshot({
          lastTestedAt: "2026-06-14T11:30:00.000Z",
          recentLogs: [{ id: "1", createdAt: "2026-06-14T11:30:00.000Z", message: "ok", success: true }],
        }),
        now,
      ),
    ).toBe("connected")
  })

  it("returns error when the latest probe failed", () => {
    expect(
      resolveShipmondoConnectorAppStatus(
        snapshot({
          recentLogs: [{ id: "1", createdAt: "2026-06-14T11:30:00.000Z", message: "bad", success: false }],
        }),
      ),
    ).toBe("error")
  })
})
