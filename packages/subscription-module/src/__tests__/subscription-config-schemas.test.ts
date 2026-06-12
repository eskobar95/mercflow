import { describe, expect, it } from "vitest"

import { upsertSubscriptionConfigBodySchema } from "../modules/subscription/http-schemas"

describe("upsertSubscriptionConfigBodySchema", (): void => {
  it("requires club fields when enabled", (): void => {
    const parsed = upsertSubscriptionConfigBodySchema.safeParse({
      club_enabled: true,
    })
    expect(parsed.success).toBe(false)
  })

  it("accepts valid enabled payload", (): void => {
    const parsed = upsertSubscriptionConfigBodySchema.safeParse({
      club_enabled: true,
      club_name: "VIP Klub",
      club_price_monthly: 89,
      club_price_annual: 890,
      club_fallback_discount_pct: 10,
    })
    expect(parsed.success).toBe(true)
  })

  it("accepts disabled payload without prices", (): void => {
    const parsed = upsertSubscriptionConfigBodySchema.safeParse({
      club_enabled: false,
    })
    expect(parsed.success).toBe(true)
  })
})
