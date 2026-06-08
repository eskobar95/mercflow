import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { describe, expect, it, vi } from "vitest"

import { GET as adminArticlesList, POST as adminArticlesCreate } from "../../src/api/admin/articles/route"
import { DELETE as adminArticlesDelete, GET as adminArticlesGet, PATCH as adminArticlesPatch } from "../../src/api/admin/articles/[id]/route"
import { CONTENT_MODULE } from "../../src/modules/content"
import type ContentModuleService from "../../src/modules/content/service"

describe("GET /admin/articles", () => {
  it("returns paginated articles array", async () => {
    const listArticlesForAdmin = vi.fn(async () => ({
      articles: [
        {
          id: "art_1",
          slug: "hello",
          title: "Hello",
          body_json: null,
          locale: "en",
          status: "draft" as const,
          published_at: null,
        },
      ],
      count: 1,
    }))

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      query: { limit: "25", offset: "0" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { listArticlesForAdmin } satisfies Pick<
              ContentModuleService,
              "listArticlesForAdmin"
            >
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await adminArticlesList(req, res)

    expect(listArticlesForAdmin).toHaveBeenCalledWith({
      locale: undefined,
      limit: 25,
      offset: 0,
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(resJson.mock.calls[0]?.[0]).toEqual({
      articles: [
        expect.objectContaining({
          id: "art_1",
          slug: "hello",
          title: "Hello",
          locale: "en",
          status: "draft",
          published_at: null,
        }),
      ],
      count: 1,
      limit: 25,
      offset: 0,
    })
  })
})

describe("POST /admin/articles", () => {
  it("creates an article at 201", async () => {
    const createArticle = vi.fn(async () => ({
      id: "art_new",
      slug: "ny-titel",
      title: "Ny titel",
      body_json: { type: "doc", content: [] },
      locale: "da",
      status: "draft" as const,
      published_at: null,
    }))

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      query: {},
      body: { title: "Ny titel", locale: "da", body_json: { type: "doc", content: [] } },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { createArticle } satisfies Pick<ContentModuleService, "createArticle">
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await adminArticlesCreate(req, res)

    expect(createArticle).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(resJson.mock.calls[0]?.[0]).toMatchObject({
      article: expect.objectContaining({ id: "art_new", slug: "ny-titel" }),
    })
  })
})

describe("GET /admin/articles/:id", () => {
  it("404 when missing", async () => {
    const retrieveArticleById = vi.fn(async () => null)

    const req = {
      params: { id: "missing" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { retrieveArticleById } satisfies Pick<
              ContentModuleService,
              "retrieveArticleById"
            >
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await expect(adminArticlesGet(req, {} as MedusaResponse)).rejects.toMatchObject({
      type: "not_found",
    })
  })
})

describe("PATCH /admin/articles/:id", () => {
  it("delegates to updateArticle", async () => {
    const updateArticle = vi.fn(async () => ({
      id: "art_1",
      slug: "hello",
      title: "Hello",
      body_json: null,
      locale: "en",
      status: "published" as const,
      published_at: new Date("2026-01-01T00:00:00.000Z"),
    }))

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      params: { id: "art_1" },
      body: { status: "published" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { updateArticle } satisfies Pick<ContentModuleService, "updateArticle">
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await adminArticlesPatch(req, res)

    expect(updateArticle).toHaveBeenCalledWith(
      "art_1",
      expect.objectContaining({ status: "published" })
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe("DELETE /admin/articles/:id", () => {
  it("returns 204", async () => {
    const deleteArticle = vi.fn(async () => {
      return undefined
    })

    const send = vi.fn()
    const res = {
      status: vi.fn(() => ({ send })),
    } as unknown as MedusaResponse

    const req = {
      params: { id: "art_1" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { deleteArticle } satisfies Pick<ContentModuleService, "deleteArticle">
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await adminArticlesDelete(req, res)

    expect(deleteArticle).toHaveBeenCalledWith("art_1")
    expect(res.status).toHaveBeenCalledWith(204)
    expect(send).toHaveBeenCalled()
  })
})
