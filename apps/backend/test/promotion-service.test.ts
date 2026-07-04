import { describe, expect, it } from "vitest"

import { createDiscountBodySchema } from "../src/lib/discounts/schemas"

describe("free shipping discount create payload", (): void => {
  it("accepts automatic free shipping body from admin UI", (): void => {
    const parsed = createDiscountBodySchema.safeParse({
      name: "Free shipping",
      discount_type: "free_shipping",
      method: "automatic",
      status: "active",
      minimum_purchase_amount: 499,
      application_method: {
        type: "percentage",
        value: 100,
        target_type: "shipping_methods",
      },
    })

    expect(parsed.success).toBe(true)
  })
})
