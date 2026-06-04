import { describe, expect, it } from "vitest"

import { slugifyCategoryHandle } from "./slugifyCategoryHandle"

describe("slugifyCategoryHandle", (): void => {
  it("slugifies a simple name", (): void => {
    expect(slugifyCategoryHandle("Outdoor Jackets")).toBe("outdoor-jackets")
  })

  it("trims and strips leading or trailing hyphens", (): void => {
    expect(slugifyCategoryHandle("  --Sale Items--  ")).toBe("sale-items")
  })

  it("returns empty string for whitespace-only input", (): void => {
    expect(slugifyCategoryHandle("   ")).toBe("")
  })
})
