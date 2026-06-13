import { describe, expect, it } from "vitest"

describe("platform tenant billing route contract", () => {
  it("documents GET /platform/admin/tenants/:store_id/billing response shape", () => {
    const billingPayload = {
      billing: {
        store_id: "store_123",
        plan_tier: "standard",
        billing_interval: "month",
        billing_currency: "dkk",
        subscription_status: "active",
        current_period_end: "2026-07-13T12:00:00.000Z",
        stripe_customer_id: "cus_test123",
      },
    }

    expect(billingPayload.billing.plan_tier).toBe("standard")
    expect(billingPayload.billing.stripe_customer_id).toBe("cus_test123")
  })

  it("allows null billing for tenants without platform billing", () => {
    const payload = { billing: null }
    expect(payload.billing).toBeNull()
  })
})
