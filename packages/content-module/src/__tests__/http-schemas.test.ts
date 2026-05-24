import { describe, expect, it } from "vitest"

import { adminProductContentPostBodySchema } from "../modules/content/http-schemas"

describe("adminProductContentPostBodySchema", (): void => {
  it("accepts product_id with optional MercFlow CMS fields", (): void => {
    const parsed = adminProductContentPostBodySchema.safeParse({
      product_id: "prod_123",
      seo_title: "Title",
      seo_description: "Desc",
    })
    expect(parsed.success).toBe(true)
    if (!parsed.success) {
      throw new Error("expected schema success")
    }
    expect(parsed.data.product_id).toBe("prod_123")
  })

  it("rejects unexpected keys", (): void => {
    const parsed = adminProductContentPostBodySchema.safeParse({
      product_id: "prod_123",
      extra_field: "nope",
    })
    expect(parsed.success).toBe(false)
  })
})
