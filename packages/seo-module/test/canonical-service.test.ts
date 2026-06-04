import { describe, expect, it } from "vitest"

import { buildProductCanonicalCore } from "../src/modules/seo/canonical-url-core"

describe("canonical-service", (): void => {
  it("auto-calculates canonical from storefront + handle", (): void => {
    const result = buildProductCanonicalCore({
      storefrontUrl: "https://shop.example/",
      handle: "wool-sweater",
      override: null,
    })
    expect(result.source).toBe("auto")
    expect(result.canonical_url).toBe("https://shop.example/wool-sweater")
    expect(result.conflict_warning).toBeNull()
  })

  it("prefers manual override and warns on host mismatch", (): void => {
    const result = buildProductCanonicalCore({
      storefrontUrl: "https://shop.example",
      handle: "wool-sweater",
      override: "https://other.example/wool-sweater",
    })
    expect(result.source).toBe("override")
    expect(result.canonical_url).toBe("https://other.example/wool-sweater")
    expect(result.conflict_warning).toContain("different host")
  })
})
