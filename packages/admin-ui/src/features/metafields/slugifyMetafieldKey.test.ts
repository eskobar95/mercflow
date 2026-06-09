import { describe, expect, it } from "vitest"

import { slugifyMetafieldKey } from "./slugifyMetafieldKey"

describe("slugifyMetafieldKey", (): void => {
  it("converts display names to snake_case keys", (): void => {
    expect(slugifyMetafieldKey("Active ingredients")).toBe("active_ingredients")
  })

  it("trims and collapses punctuation", (): void => {
    expect(slugifyMetafieldKey("  SPF Level!  ")).toBe("spf_level")
  })
})
