import { describe, expect, it } from "vitest"

import {
  platformAuditQuerySchema,
  platformEmailDeliveriesQuerySchema,
  resolvePlatformListLimit,
  resolvePlatformListOffset,
} from "../src/lib/platform-http/list-query"

describe("platform list query helpers", () => {
  it("defaults limit and offset", () => {
    expect(resolvePlatformListLimit(undefined)).toBe(50)
    expect(resolvePlatformListOffset(undefined)).toBe(0)
  })

  it("parses email delivery query params", () => {
    const parsed = platformEmailDeliveriesQuerySchema.parse({
      q: "order_123",
      limit: "25",
      offset: "10",
    })

    expect(parsed).toEqual({
      q: "order_123",
      limit: 25,
      offset: 10,
    })
  })

  it("parses audit date filters", () => {
    const parsed = platformAuditQuerySchema.parse({
      from: "2026-06-01T00:00:00.000Z",
      to: "2026-06-02T00:00:00.000Z",
    })

    expect(parsed.from).toBe("2026-06-01T00:00:00.000Z")
    expect(parsed.to).toBe("2026-06-02T00:00:00.000Z")
  })
})
