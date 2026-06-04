import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { describe, expect, it, vi } from "vitest"

import { GET } from "../../src/api/store/pages/[slug]/route"
import { CONTENT_MODULE } from "../../src/modules/content"
import type ContentModuleService from "../../src/modules/content/service"

describe("GET /store/pages/:slug", () => {
  it("returns JSON at 200 for a published page", async () => {
    const findPublishedPageForStorefront = vi.fn(async () => ({
      title: "About",
      slug: "about",
      page_type: "content" as const,
      status: "published" as const,
      blocks: [],
    }))

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      params: { slug: "about" },
      query: { locale: "en" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { findPublishedPageForStorefront } satisfies Pick<
              ContentModuleService,
              "findPublishedPageForStorefront"
            >
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await GET(req, res)

    expect(findPublishedPageForStorefront).toHaveBeenCalledWith("about", "en")
    expect(res.status).toHaveBeenCalledWith(200)
    expect(resJson).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "about", blocks: [] })
    )
  })

  it("throws when page is not published", async () => {
    const findPublishedPageForStorefront = vi.fn(async () => null)

    const req = {
      params: { slug: "draft-only" },
      query: { locale: "en" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { findPublishedPageForStorefront } satisfies Pick<
              ContentModuleService,
              "findPublishedPageForStorefront"
            >
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await expect(GET(req, {} as MedusaResponse)).rejects.toThrow()
  })
})
