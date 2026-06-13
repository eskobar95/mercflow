import { describe, expect, it } from "vitest"

import {
  buildStripeCustomerDashboardUrl,
  canSuspendTenantBilling,
  formatBillingCurrency,
  formatBillingInterval,
  formatPlanTierLabel,
  normalizeBillingSubscriptionStatus,
} from "../src/lib/tenantBilling"
import type { PlatformTenantBilling } from "../src/lib/platformTenantsApi"

const sampleBilling: PlatformTenantBilling = {
  store_id: "store_123",
  clerk_org_id: "org_123",
  stripe_customer_id: "cus_test123",
  stripe_subscription_id: "sub_test123",
  stripe_price_id: "price_test123",
  plan_tier: "standard",
  billing_interval: "month",
  billing_currency: "dkk",
  subscription_status: "active",
  current_period_end: "2026-07-13T12:00:00.000Z",
  created_at: "2026-06-13T12:00:00.000Z",
  updated_at: "2026-06-13T12:00:00.000Z",
}

describe("tenantBilling helpers", () => {
  it("normalizes subscription statuses", () => {
    expect(normalizeBillingSubscriptionStatus("active")).toBe("active")
    expect(normalizeBillingSubscriptionStatus("past_due")).toBe("past_due")
    expect(normalizeBillingSubscriptionStatus("canceled")).toBe("canceled")
    expect(normalizeBillingSubscriptionStatus("unknown")).toBe("unknown")
  })

  it("formats plan tier and interval labels", () => {
    expect(formatPlanTierLabel("standard")).toBe("Standard")
    expect(formatPlanTierLabel("pro")).toBe("Pro")
    expect(formatBillingInterval("month")).toBe("Monthly")
    expect(formatBillingInterval("year")).toBe("Annual")
    expect(formatBillingCurrency("dkk")).toBe("DKK")
  })

  it("builds Stripe dashboard customer URL", () => {
    expect(buildStripeCustomerDashboardUrl("cus_test123")).toBe(
      "https://dashboard.stripe.com/customers/cus_test123",
    )
  })

  it("blocks suspend for canceled billing or disabled tenant", () => {
    expect(canSuspendTenantBilling(sampleBilling, false)).toBe(true)
    expect(
      canSuspendTenantBilling(
        { ...sampleBilling, subscription_status: "canceled" },
        false,
      ),
    ).toBe(false)
    expect(canSuspendTenantBilling(sampleBilling, true)).toBe(false)
    expect(canSuspendTenantBilling(null, false)).toBe(false)
  })
})
