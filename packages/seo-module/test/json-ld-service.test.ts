import { describe, expect, it } from "vitest"

import {
  buildCategoryJsonLd,
  buildGlobalJsonLd,
  buildProductJsonLd,
} from "../src/modules/seo/json-ld-service"

describe("json-ld-service", (): void => {
  it("builds Product + Offer graph with tenant storefront URL", (): void => {
    const payload = buildProductJsonLd({
      storefrontUrl: "https://shop.example",
      productUrl: "https://shop.example/wool-sweater",
      name: "Wool sweater",
      description: "Warm",
      imageUrl: "https://cdn.example/img.jpg",
      sku: "SKU-1",
      price: "199.00",
      currency: "DKK",
      availability: "InStock",
    })
    expect(payload).not.toBeNull()
    expect(payload?.["@graph"]).toHaveLength(2)
    const product = payload?.["@graph"][0] as Record<string, unknown>
    expect(product["@type"]).toBe("Product")
    expect(product.url).toBe("https://shop.example/wool-sweater")
  })

  it("omits Organization when org name is empty", (): void => {
    const payload = buildGlobalJsonLd({
      storefrontUrl: "https://shop.example",
      orgName: null,
      orgLogoUrl: null,
      orgSocialUrls: null,
    })
    const types = (payload?.["@graph"] ?? []).map(
      (node) => (node as Record<string, unknown>)["@type"]
    )
    expect(types).not.toContain("Organization")
    expect(types).toContain("WebSite")
  })

  it("returns null when product JSON-LD disabled", (): void => {
    const payload = buildProductJsonLd({
      storefrontUrl: "https://shop.example",
      productUrl: "https://shop.example/item",
      name: "Item",
      description: null,
      imageUrl: null,
      sku: null,
      price: null,
      currency: null,
      availability: null,
      settings: { product: false, category: true, global: true },
    })
    expect(payload).toBeNull()
  })

  it("builds BreadcrumbList for category path", (): void => {
    const payload = buildCategoryJsonLd({
      storefrontUrl: "https://shop.example",
      breadcrumbs: [
        { name: "Home", url: "https://shop.example/" },
        { name: "Shoes", url: "https://shop.example/categories/shoes" },
      ],
    })
    const list = payload?.["@graph"][0] as Record<string, unknown>
    expect(list["@type"]).toBe("BreadcrumbList")
    expect(list.itemListElement).toHaveLength(2)
  })
})
