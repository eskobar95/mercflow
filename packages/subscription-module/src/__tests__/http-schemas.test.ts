import { describe, expect, it } from "vitest"

import { listSubscriptionsQuerySchema } from "../modules/subscription/http-schemas"

describe("listSubscriptionsQuerySchema", (): void => {
  it("applies sane defaults", (): void => {
    const parsed = listSubscriptionsQuerySchema.parse({})
    expect(parsed.limit).toBe(50)
    expect(parsed.offset).toBe(0)
    expect(parsed.customer_id).toBeUndefined()
  })

  it("accepts customer filter", (): void => {
    const parsed = listSubscriptionsQuerySchema.parse({ customer_id: "cus_test" })
    expect(parsed.customer_id).toBe("cus_test")
  })
})
