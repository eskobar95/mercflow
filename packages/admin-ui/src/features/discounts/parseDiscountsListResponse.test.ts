import { describe, expect, it } from "vitest"

import { parseDiscountsListEnvelope } from "./parseDiscountsListResponse"

describe("parseDiscountsListEnvelope", (): void => {
  it("parses a valid discount list envelope", (): void => {
    const parsed = parseDiscountsListEnvelope({
      data: [
        {
          id: "promo_1",
          store_id: "store_1",
          name: "Weekend",
          code: "WEEKEND10",
          type: "Order",
          method: "Code",
          status: "active",
          usage_count: 2,
          usage_limit: 100,
          expires_at: null,
          created_at: null,
          updated_at: null,
        },
      ],
      count: 1,
      limit: 50,
      offset: 0,
    })

    expect(parsed?.data[0]?.name).toBe("Weekend")
  })

  it("returns null for invalid envelopes", (): void => {
    expect(parseDiscountsListEnvelope({ data: "nope" })).toBeNull()
  })
})
