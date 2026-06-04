import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { describe, expect, it, vi } from "vitest"

import { DELETE, GET as getById, PATCH } from "../../src/api/admin/pages/[id]/route"
import { GET as listGet, POST as listPost } from "../../src/api/admin/pages/route"
import { CONTENT_MODULE } from "../../src/modules/content"
import type ContentModuleService from "../../src/modules/content/service"

describe("GET /admin/pages", () => {
  it("returns pages and count at 200", async () => {
    const adminListPages = vi.fn(async () => ({
      pages: [
        {
          id: "pg_1",
          slug: "about",
          title: "About",
          page_type: "content" as const,
          status: "published" as const,
          locale: "en",
          block_count: 0,
        },
      ],
      count: 1,
    }))

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      query: { locale: "en", limit: "10", offset: "0" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { adminListPages } satisfies Pick<ContentModuleService, "adminListPages">
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await listGet(req, res)

    expect(adminListPages).toHaveBeenCalledWith({ locale: "en", limit: 10, offset: 0 })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(resJson).toHaveBeenCalledWith(
      expect.objectContaining({
        pages: expect.any(Array),
        count: 1,
      })
    )
  })
})

describe("POST /admin/pages", () => {
  it("returns 400 on invalid body", async () => {
    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      query: {},
      body: { title: "X" },
      scope: { resolve: vi.fn() },
    } as unknown as MedusaRequest

    await listPost(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe("PATCH /admin/pages/:id", () => {
  it("updates page and returns payload at 200", async () => {
    const adminUpdatePage = vi.fn(async () => ({
      changed: true,
      page: {
        id: "pg_1",
        slug: "new",
        title: "T",
        page_type: "content" as const,
        status: "draft" as const,
        locale: "en",
        block_count: 2,
      },
    }))

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      params: { id: "pg_1" },
      body: { slug: "new" },
      query: { store_id: "store_test" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { adminUpdatePage } satisfies Pick<ContentModuleService, "adminUpdatePage">
          }
          if (key === "event_bus") {
            return { emit: vi.fn(async () => undefined) }
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await PATCH(req, res)

    expect(adminUpdatePage).toHaveBeenCalledWith("pg_1", { slug: "new" })
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe("GET /admin/pages/:id", () => {
  it("returns 404 when missing", async () => {
    const adminRetrievePage = vi.fn(async () => null)

    const req = {
      params: { id: "missing" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { adminRetrievePage } satisfies Pick<ContentModuleService, "adminRetrievePage">
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await expect(getById(req, {} as MedusaResponse)).rejects.toThrow()
  })
})

describe("DELETE /admin/pages/:id", () => {
  it("calls soft delete and returns 204", async () => {
    const adminSoftDeletePage = vi.fn(async () => undefined)
    const resSend = vi.fn()
    const res = {
      status: vi.fn(() => ({ send: resSend })),
    } as unknown as MedusaResponse

    const req = {
      params: { id: "pg_1" },
      query: { store_id: "store_test" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { adminSoftDeletePage } satisfies Pick<ContentModuleService, "adminSoftDeletePage">
          }
          if (key === "event_bus") {
            return { emit: vi.fn(async () => undefined) }
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await DELETE(req, res)

    expect(adminSoftDeletePage).toHaveBeenCalledWith("pg_1")
    expect(res.status).toHaveBeenCalledWith(204)
  })
})
