import { describe, expect, it } from "vitest"

import { buildSitemapXml } from "../src/modules/seo/sitemap-xml"

describe("buildSitemapXml", (): void => {
  it("returns valid urlset with escaped loc", (): void => {
    const xml = buildSitemapXml([
      {
        loc: "https://shop.example/products/a&b",
        changefreq: "weekly",
        priority: 0.8,
      },
    ])
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain("<urlset")
    expect(xml).toContain("products/a&amp;b")
    expect(xml).toContain("<priority>0.8</priority>")
  })
})
