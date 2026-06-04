import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { describe, expect, it, vi } from "vitest"

import { GET as storeArticlesList } from "../../src/api/store/articles/route"
import { GET as storeArticleBySlug } from "../../src/api/store/articles/[slug]/route"
import { CONTENT_MODULE } from "../../src/modules/content"
import type ContentModuleService from "../../src/modules/content/service"

describe("GET /store/articles", () => {
  it("lists published articles only", async () => {
    const listPublishedArticles = vi.fn(async () => [
      {
        id: "a1",
        slug: "hello",
        title: "Hello",
        body_json: { type: "doc", content: [] },
        locale: "en",
        status: "published" as const,
        published_at: new Date("2026-01-02T00:00:00.000Z"),
      },
    ])

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      query: { locale: "en" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { listPublishedArticles } satisfies Pick<
              ContentModuleService,
              "listPublishedArticles"
            >
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await storeArticlesList(req, res)

    expect(listPublishedArticles).toHaveBeenCalledWith("en")
    expect(resJson.mock.calls[0]?.[0].articles[0]).toEqual(
      expect.objectContaining({
        id: "a1",
        slug: "hello",
        title: "Hello",
        locale: "en",
      })
    )
    expect(resJson.mock.calls[0]?.[0].articles[0]).not.toHaveProperty("body_json")
  })
})

describe("GET /store/articles/:slug", () => {
  it("returns published article JSON", async () => {
    const findPublishedArticleBySlug = vi.fn(async () => ({
      id: "a1",
      slug: "hello",
      title: "Hello",
      body_json: { type: "doc", content: [] },
      locale: "en",
      status: "published" as const,
      published_at: new Date("2026-01-02T00:00:00.000Z"),
    }))

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      params: { slug: "hello" },
      query: { locale: "en" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { findPublishedArticleBySlug } satisfies Pick<
              ContentModuleService,
              "findPublishedArticleBySlug"
            >
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await storeArticleBySlug(req, res)

    expect(findPublishedArticleBySlug).toHaveBeenCalledWith("hello", "en")
    expect(resJson.mock.calls[0]?.[0].article).toEqual(
      expect.objectContaining({
        slug: "hello",
        body_json: { type: "doc", content: [] },
      })
    )
  })
})
