import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { confirmStripeSubscriptionForTenant } from "../src/lib/platform-billing/confirm-stripe-subscription"

vi.mock("../src/lib/platform-billing/stripe-platform-client", () => ({
  getStripePlatformClient: vi.fn(),
}))

vi.mock("../src/lib/platform-db/platform-tenant-billing", () => ({
  upsertPlatformTenantBilling: vi.fn(),
}))

import { getStripePlatformClient } from "../src/lib/platform-billing/stripe-platform-client"
import { upsertPlatformTenantBilling } from "../src/lib/platform-db/platform-tenant-billing"

describe("confirmStripeSubscriptionForTenant", () => {
  const mockStripe = {
    subscriptions: {
      retrieve: vi.fn(),
      update: vi.fn(),
    },
    customers: {
      update: vi.fn(),
    },
    paymentIntents: {
      retrieve: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.mocked(getStripePlatformClient).mockReturnValue(mockStripe as never)
    vi.mocked(upsertPlatformTenantBilling).mockReset()
    mockStripe.subscriptions.retrieve.mockReset()
    mockStripe.subscriptions.update.mockReset()
    mockStripe.customers.update.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("updates Stripe customer and subscription metadata and upserts platform_tenant_billing", async () => {
    mockStripe.subscriptions.retrieve.mockResolvedValue({
      id: "sub_123",
      status: "active",
      current_period_end: 1_735_689_600,
      metadata: {
        plan_tier: "standard",
        billing_interval: "month",
      },
      items: {
        data: [
          {
            price: {
              id: "price_123",
              metadata: { mercflow_interval: "month" },
              recurring: { interval: "month" },
              product: {
                metadata: { mercflow_tier: "standard" },
                name: "MercFlow Standard",
              },
            },
          },
        ],
      },
    })

    await confirmStripeSubscriptionForTenant({
      storeId: "store_01",
      clerkOrgId: "org_abc",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      stripePaymentIntentId: "pi_123",
      billingCurrency: "dkk",
    })

    expect(mockStripe.customers.update).toHaveBeenCalledWith("cus_123", {
      metadata: {
        store_id: "store_01",
        clerk_org_id: "org_abc",
        mercflow_platform: "true",
      },
    })

    expect(mockStripe.subscriptions.update).toHaveBeenCalledWith("sub_123", {
      metadata: {
        store_id: "store_01",
        clerk_org_id: "org_abc",
        mercflow_platform: "true",
        plan_tier: "standard",
        billing_interval: "month",
      },
    })

    expect(upsertPlatformTenantBilling).toHaveBeenCalledWith({
      store_id: "store_01",
      clerk_org_id: "org_abc",
      stripe_customer_id: "cus_123",
      stripe_subscription_id: "sub_123",
      stripe_price_id: "price_123",
      plan_tier: "standard",
      billing_interval: "month",
      billing_currency: "dkk",
      subscription_status: "active",
      current_period_end: new Date(1_735_689_600 * 1000),
    })
  })

  it("throws when subscription is not active", async () => {
    mockStripe.subscriptions.retrieve.mockResolvedValue({
      id: "sub_123",
      status: "past_due",
      items: { data: [] },
    })

    await expect(
      confirmStripeSubscriptionForTenant({
        storeId: "store_01",
        clerkOrgId: "org_abc",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        stripePaymentIntentId: "pi_123",
        billingCurrency: "dkk",
      }),
    ).rejects.toThrow("Stripe subscription status is past_due")

    expect(upsertPlatformTenantBilling).not.toHaveBeenCalled()
  })
})
