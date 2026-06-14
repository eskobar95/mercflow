import { describe, expect, it } from "vitest"

import { signupBillingSetupBodySchema, signupProvisionBodySchema } from "../src/lib/platform-provisioning/validators"

describe("signup billing setup validators", () => {
  it("accepts valid signup billing setup payload with price_id", () => {
    const parsed = signupBillingSetupBodySchema.parse({
      price_id: "price_123",
      invite_token: "token-123",
      email: "hello@example.com",
      store_name: "Kaffehuset",
    })

    expect(parsed.price_id).toBe("price_123")
    expect(parsed.store_name).toBe("Kaffehuset")
  })

  it("rejects missing price_id", () => {
    const result = signupBillingSetupBodySchema.safeParse({
      invite_token: "token-123",
      email: "hello@example.com",
      store_name: "Kaffehuset",
    })

    expect(result.success).toBe(false)
  })

  it("rejects price_id without price_ prefix", () => {
    const result = signupBillingSetupBodySchema.safeParse({
      price_id: "prod_123",
      invite_token: "token-123",
      email: "hello@example.com",
      store_name: "Kaffehuset",
    })

    expect(result.success).toBe(false)
  })
})

describe("signup provision validators", () => {
  it("accepts valid signup provision payload", () => {
    const parsed = signupProvisionBodySchema.parse({
      invite_token: "token-123",
      clerk_user_id: "user_abc",
      store_name: "Kaffehuset",
      domain: "kaffehuset.mercflow.shop",
      email: "hello@example.com",
      currency: "dkk",
      country: "dk",
      timezone: "Europe/Copenhagen",
      stripe_payment_intent_id: "pi_123",
      stripe_customer_id: "cus_123",
      stripe_subscription_id: "sub_123",
    })

    expect(parsed.store_name).toBe("Kaffehuset")
  })

  it("rejects invalid domain in signup provision payload", () => {
    const result = signupProvisionBodySchema.safeParse({
      invite_token: "token-123",
      clerk_user_id: "user_abc",
      store_name: "Kaffehuset",
      domain: "not a domain",
      email: "hello@example.com",
      currency: "dkk",
      country: "dk",
      timezone: "Europe/Copenhagen",
      stripe_payment_intent_id: "pi_123",
    })

    expect(result.success).toBe(false)
  })
})
