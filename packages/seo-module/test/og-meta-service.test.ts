import { describe, expect, it } from "vitest"

import {
  buildOgMetaTags,
  resolveOgDescription,
  resolveOgTitle,
} from "../src/modules/seo/og-meta-service"

describe("og-meta-service", (): void => {
  it("falls back to product title when seo_title empty", (): void => {
    expect(resolveOgTitle(null, "Blue Jacket")).toBe("Blue Jacket")
    expect(resolveOgTitle("  ", "Blue Jacket")).toBe("Blue Jacket")
    expect(resolveOgTitle("Custom", "Blue Jacket")).toBe("Custom")
  })

  it("includes Twitter Card tags", (): void => {
    const tags = buildOgMetaTags({
      pageUrl: "https://shop.example/item",
      title: "Item",
      description: "Desc",
      imageUrl: "https://cdn.example/a.jpg",
      type: "product",
    })
    expect(tags["twitter:card"]).toBe("summary_large_image")
    expect(tags["og:type"]).toBe("product")
  })

  it("uses description fallback chain", (): void => {
    expect(resolveOgDescription(null, "Core desc")).toBe("Core desc")
    expect(resolveOgDescription("SEO desc", "Core desc")).toBe("SEO desc")
  })
})
