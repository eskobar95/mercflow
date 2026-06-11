import { describe, expect, it } from "vitest"

import {
  provisionTenantBodySchema,
  suspendTenantBodySchema,
} from "../src/lib/platform-tenants/validators"

describe("platform tenant validators", () => {
  it("accepts valid provision payload", () => {
    const parsed = provisionTenantBodySchema.parse({
      name: "Salon Maria",
      domain: "shop.salon-maria.dk",
      email: "maria@salon-maria.dk",
      currency: "dkk",
      timezone: "Europe/Copenhagen",
    })

    expect(parsed.currency).toBe("dkk")
  })

  it("rejects invalid provision domain", () => {
    const result = provisionTenantBodySchema.safeParse({
      name: "Test",
      domain: "not a domain",
      email: "a@b.co",
    })

    expect(result.success).toBe(false)
  })

  it("requires suspend reason", () => {
    const result = suspendTenantBodySchema.safeParse({ reason: "   " })
    expect(result.success).toBe(false)
  })
})
