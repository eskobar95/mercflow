import { describe, expect, it } from "vitest"

import { seoConfigBodySchema } from "../src/modules/seo/http-schemas"

describe("seoConfigBodySchema", (): void => {
  it("rejects org_social_urls with non-URL values", (): void => {
    const result = seoConfigBodySchema.safeParse({
      org_social_urls: { facebook: "not-a-url" },
    })
    expect(result.success).toBe(false)
  })

  it("accepts org_social_urls with valid URL values", (): void => {
    const result = seoConfigBodySchema.safeParse({
      org_social_urls: {
        facebook: "https://facebook.com/acme",
        instagram: "https://instagram.com/acme",
      },
    })
    expect(result.success).toBe(true)
  })
})
