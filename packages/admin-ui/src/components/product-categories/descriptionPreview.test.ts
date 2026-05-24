import { describe, expect, it } from "vitest"

import { formatCategoryDescriptionPreview } from "@/components/product-categories/descriptionPreview"

describe("formatCategoryDescriptionPreview", () => {
  it("returns null for empty descriptions", () => {
    expect(formatCategoryDescriptionPreview(null)).toBe(null)
    expect(formatCategoryDescriptionPreview("   ")).toBe(null)
  })

  it("truncates long strings", () => {
    const long = `${"words ".repeat(80)}trail`
    const out = formatCategoryDescriptionPreview(long)
    expect(out).not.toBeNull()
    expect(out?.endsWith("…")).toBe(true)
    expect((out ?? "").length).toBeGreaterThan(0)
  })
})
