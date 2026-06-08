import { describe, expect, it, vi } from "vitest"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  buildV1RedirectTarget,
  isMercflowOwnedStorePath,
  isMercflowPublicPath,
  shouldRedirectToV1,
} from "../src/lib/store-route-versioning/mercflow-owned-store-paths"
import { storeRouteVersionRedirectMiddleware } from "../src/lib/store-route-versioning/store-route-version-redirect"

describe("mercflow-owned-store-paths", (): void => {
  it("matches MercFlow store prefixes", (): void => {
    expect(isMercflowOwnedStorePath("/store/seo/json-ld/product/prod_01")).toBe(true)
    expect(isMercflowOwnedStorePath("/store/articles")).toBe(true)
  })

  it("does not match Medusa core store routes", (): void => {
    expect(isMercflowOwnedStorePath("/store/products")).toBe(false)
    expect(isMercflowOwnedStorePath("/store/carts/cart_01")).toBe(false)
  })

  it("matches MercFlow public paths", (): void => {
    expect(isMercflowPublicPath("/sitemap.xml")).toBe(true)
    expect(isMercflowPublicPath("/feed/google-shopping.xml")).toBe(true)
  })

  it("shouldRedirectToV1 skips versioned paths", (): void => {
    expect(shouldRedirectToV1("/v1/store/seo/json-ld/global")).toBe(false)
  })

  it("buildV1RedirectTarget preserves query string", (): void => {
    expect(buildV1RedirectTarget("/store/seo/json-ld/global", "?locale=da")).toBe(
      "/v1/store/seo/json-ld/global?locale=da"
    )
  })
})

describe("storeRouteVersionRedirectMiddleware", (): void => {
  it("returns 301 for unversioned MercFlow store route", (): void => {
    const redirect = vi.fn()
    const next = vi.fn()
    const req = {
      method: "GET",
      path: "/store/seo/json-ld/product/prod_01",
      url: "/store/seo/json-ld/product/prod_01?locale=en",
    } as unknown as MedusaRequest
    const res = { redirect } as unknown as MedusaResponse

    storeRouteVersionRedirectMiddleware(req, res, next)

    expect(redirect).toHaveBeenCalledWith(301, "/v1/store/seo/json-ld/product/prod_01?locale=en")
    expect(next).not.toHaveBeenCalled()
  })

  it("passes through Medusa core store routes", (): void => {
    const redirect = vi.fn()
    const next = vi.fn()
    const req = { method: "GET", path: "/store/products", url: "/store/products" } as unknown as MedusaRequest
    const res = { redirect } as unknown as MedusaResponse

    storeRouteVersionRedirectMiddleware(req, res, next)

    expect(redirect).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })
})
