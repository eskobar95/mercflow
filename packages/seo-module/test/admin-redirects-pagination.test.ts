import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { describe, expect, it, vi } from "vitest"

import { GET as adminRedirectsList } from "../src/api/admin/redirects/route"
import { SEO_MODULE } from "../src/modules/seo"
import type SeoModuleService from "../src/modules/seo/service"

describe("GET /admin/redirects pagination", () => {
  it("caps take at 100 when limit=200 is requested", async (): Promise<void> => {
    const redirects = Array.from({ length: 100 }, (_, index) => ({
      id: `red_${index}`,
      store_id: "store_01TEST",
      from_path: `/old-${index}`,
      to_path: `/new-${index}`,
      type: "manual" as const,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    }))

    const listRedirects = vi.fn(async () => ({
      redirects,
      count: 250,
    }))
    const redirectHasChainIssue = vi.fn(async () => false)

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      query: { store_id: "store_01TEST", limit: "200", offset: "0" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === SEO_MODULE) {
            return { listRedirects, redirectHasChainIssue } satisfies Pick<
              SeoModuleService,
              "listRedirects" | "redirectHasChainIssue"
            >
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await adminRedirectsList(req, res)

    expect(listRedirects).toHaveBeenCalledWith("store_01TEST", {
      limit: 100,
      offset: 0,
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(resJson.mock.calls[0]?.[0]).toMatchObject({
      count: 250,
      limit: 100,
      offset: 0,
      redirects: expect.any(Array),
    })
    expect(resJson.mock.calls[0]?.[0].redirects).toHaveLength(100)
  })
})
