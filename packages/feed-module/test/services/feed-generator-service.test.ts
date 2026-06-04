import { describe, expect, it, vi } from "vitest"

import { FeedGeneratorService } from "../../src/modules/feed/feed-generator-service"
import type { FeedConfigRecord, FeedCatalogProduct } from "../../src/modules/feed/types"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"
const STORE_B = "store_01ABCDEFGHIJKLMNOPQRSTUVWXYZ"

const baseConfig = (overrides: Partial<FeedConfigRecord> = {}): FeedConfigRecord => ({
  id: "fc_1",
  store_id: STORE_A,
  storefront_url: "https://shop-a.example",
  excluded_product_ids: [],
  excluded_category_ids: [],
  default_condition: "new",
  ...overrides,
})

const sampleProduct = (overrides: Partial<FeedCatalogProduct> = {}): FeedCatalogProduct => ({
  id: "prod_a",
  title: "Alpha Mug",
  handle: "alpha-mug",
  description: "Core description",
  status: "published",
  thumbnail: "https://cdn.example/thumb.jpg",
  category_ids: [],
  variants: [
    {
      id: "var_a",
      sku: "SKU-A",
      manage_inventory: true,
      inventory_quantity: 3,
      prices: [{ amount: 1999, currency_code: "dkk" }],
    },
  ],
  ...overrides,
})

describe("FeedGeneratorService", (): void => {
  it("builds link and image_link from tenant storefront_url", async (): Promise<void> => {
    const feedConfigService = {
      get: vi.fn().mockResolvedValue(baseConfig()),
    }
    const generator = new FeedGeneratorService({
      feedConfigService: feedConfigService as never,
      loadCatalog: async () => [sampleProduct()],
      loadContentForProduct: async () => ({
        seo_description: "SEO text",
        image_url: "https://cdn.example/gallery.jpg",
      }),
      loadBrandName: async () => "Acme",
    })

    const xml = await generator.generate(STORE_A)
    expect(xml).toContain("<g:link>https://shop-a.example/alpha-mug</g:link>")
    expect(xml).toContain("<g:image_link>https://cdn.example/gallery.jpg</g:image_link>")
    expect(xml).toContain("<g:description>SEO text</g:description>")
    expect(xml).toContain("<g:brand>Acme</g:brand>")
    expect(xml).toContain("<g:price>19.99 DKK</g:price>")
  })

  it("omits products in excluded categories", async (): Promise<void> => {
    const feedConfigService = {
      get: vi.fn().mockResolvedValue(
        baseConfig({ excluded_category_ids: ["cat_1"] })
      ),
    }
    const generator = new FeedGeneratorService({
      feedConfigService: feedConfigService as never,
      loadCatalog: async () => [
        sampleProduct({ category_ids: ["cat_1"] }),
      ],
      loadContentForProduct: async () => ({ seo_description: null, image_url: null }),
      loadBrandName: async () => null,
    })

    const xml = await generator.generate(STORE_A)
    expect(xml).not.toContain("SKU-A")
  })

  it("omits excluded products", async (): Promise<void> => {
    const feedConfigService = {
      get: vi.fn().mockResolvedValue(
        baseConfig({ excluded_product_ids: ["prod_a"] })
      ),
    }
    const generator = new FeedGeneratorService({
      feedConfigService: feedConfigService as never,
      loadCatalog: async () => [sampleProduct()],
      loadContentForProduct: async () => ({ seo_description: null, image_url: null }),
      loadBrandName: async () => null,
    })

    const xml = await generator.generate(STORE_A)
    expect(xml).not.toContain("SKU-A")
  })

  it("isolates tenants via separate catalog loaders", async (): Promise<void> => {
    const configFor = (storeId: string): FeedConfigRecord => ({
      ...baseConfig(),
      store_id: storeId,
      storefront_url:
        storeId === STORE_A ? "https://shop-a.example" : "https://shop-b.example",
    })

    const generatorFor = (storeId: string): FeedGeneratorService =>
      new FeedGeneratorService({
        feedConfigService: {
          get: vi.fn().mockResolvedValue(configFor(storeId)),
        } as never,
        loadCatalog: async () => [
          sampleProduct({
            id: storeId === STORE_A ? "prod_a" : "prod_b",
            handle: storeId === STORE_A ? "only-a" : "only-b",
            variants: [
              {
                id: "v1",
                sku: storeId === STORE_A ? "SKU-A" : "SKU-B",
                manage_inventory: false,
                inventory_quantity: null,
                prices: [{ amount: 1000, currency_code: "eur" }],
              },
            ],
          }),
        ],
        loadContentForProduct: async () => ({ seo_description: null, image_url: null }),
        loadBrandName: async () => null,
      })

    const xmlA = await generatorFor(STORE_A).generate(STORE_A)
    const xmlB = await generatorFor(STORE_B).generate(STORE_B)

    expect(xmlA).toContain("SKU-A")
    expect(xmlA).not.toContain("SKU-B")
    expect(xmlB).toContain("SKU-B")
    expect(xmlB).not.toContain("SKU-A")
    expect(xmlA).toContain("https://shop-a.example/only-a")
    expect(xmlB).toContain("https://shop-b.example/only-b")
  })
})
