import { describe, expect, it, vi } from "vitest"

import type { StripeCatalogSyncDeps } from "../src/modules/connector/stripe/stripe-sync-all-products"
import { syncMercflowCatalogToStripe } from "../src/modules/connector/stripe/stripe-sync-all-products"

describe("syncMercflowCatalogToStripe", (): void => {
  it("only calls Stripe product create once when search starts empty then returns hits", async (): Promise<void> => {
    const graphFn = vi.fn().mockResolvedValue({
      data: [
        {
          id: "prod_medusa",
          title: "Sneaker",
          handle: "sneaker",
          variants: [{ id: "variant_1", prices: [{ amount: 1999, currency_code: "dkk" }] }],
        },
      ],
      metadata: { take: 50 },
    })

    const deps: StripeCatalogSyncDeps = { graph: graphFn }

    let productHits = 0
    let priceHits = 0

    const productsSearch = vi.fn(async () => {
      productHits += 1
      return productHits === 1 ? { data: [] } : { data: [{ id: "prod_cached" }] }
    })

    const pricesSearch = vi.fn(async () => {
      priceHits += 1
      return priceHits === 1 ? { data: [] } : { data: [{ id: "price_cached" }] }
    })

    const productsCreate = vi.fn().mockResolvedValue({ id: "prod_new", active: true })
    const productsUpdate = vi.fn().mockResolvedValue({ id: "prod_cached", active: true })

    const pricesRetrieve = vi.fn().mockResolvedValue({
      id: "price_cached",
      currency: "dkk",
      unit_amount: 1999,
      active: true,
      tax_behavior: "inclusive",
    })
    const pricesCreate = vi.fn().mockResolvedValue({ id: "price_new", active: true })

    const stripeStub = {
      products: { search: productsSearch, create: productsCreate, update: productsUpdate },
      prices: {
        search: pricesSearch,
        retrieve: pricesRetrieve,
        update: vi.fn(),
        create: pricesCreate,
      },
    }

    await syncMercflowCatalogToStripe(stripeStub as never, deps)
    await syncMercflowCatalogToStripe(stripeStub as never, deps)

    expect(productsCreate).toHaveBeenCalledTimes(1)
    expect(pricesCreate).toHaveBeenCalledTimes(1)
    expect(pricesCreate.mock.calls[0]?.[0]).toMatchObject({ tax_behavior: "inclusive" })
    expect(productsUpdate.mock.calls.length).toBeGreaterThanOrEqual(1)
    expect(priceHits).toBeGreaterThanOrEqual(2)
  })
})
