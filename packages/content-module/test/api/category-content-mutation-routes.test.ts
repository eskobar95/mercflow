import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IFileModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/framework/utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST as adminCategoryContentPost } from "../../src/api/admin/category-content/route"
import { PATCH as adminCategoryContentPatch } from "../../src/api/admin/category-content/[id]/route"
import { CONTENT_MODULE } from "../../src/modules/content"
import type ContentModuleService from "../../src/modules/content/service"

vi.mock("@medusajs/framework/http", async (orig) => {
  const actual = await orig<(typeof import("@medusajs/framework/http"))>()
  return {
    ...actual,
    refetchEntity: vi.fn(async () => ({
      id: "pcat_z",
      is_active: true,
      is_internal: false,
    })),
  }
})

describe("POST /admin/category-content", () => {
  beforeEach(async () => {
    const http = await import("@medusajs/framework/http")
    vi.mocked(http.refetchEntity).mockResolvedValue({
      id: "pcat_z",
      is_active: true,
      is_internal: false,
    })
  })

  it("upserts category content and returns read payload at 200", async () => {
    const upsertCategoryContent = vi.fn(async () => ({
      id: "cc_new",
      category_id: "pcat_z",
      locale: "da",
      version: 1,
      cms_status: "published" as const,
      description_rich: { type: "doc", content: [] },
      seo_title: "Meta",
      seo_description: "Hi",
      seo_og_image_id: "https://example.com/og.png",
      banner_image_id: "https://example.com/b.png",
      canonical_url_override: null,
    }))

    const retrieveFile = vi.fn()

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      query: { locale: "da" },
      body: {
        category_id: "pcat_z",
        description_rich: { type: "doc", content: [] },
        seo_title: "Meta",
        seo_description: "Hi",
        seo_og_image_id: "https://example.com/og.png",
        banner_image_id: "https://example.com/b.png",
      },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { upsertCategoryContent } satisfies Pick<
              ContentModuleService,
              "upsertCategoryContent"
            >
          }
          if (key === Modules.FILE) {
            return { retrieveFile } as unknown as IFileModuleService
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await adminCategoryContentPost(req, res)

    expect(upsertCategoryContent).toHaveBeenCalledWith(
      "pcat_z",
      "da",
      expect.objectContaining({
        description_rich: { type: "doc", content: [] },
        seo_title: "Meta",
        seo_description: "Hi",
        seo_og_image_id: "https://example.com/og.png",
        banner_image_id: "https://example.com/b.png",
      })
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(resJson.mock.calls[0]?.[0]).toMatchObject({
      id: "cc_new",
      category_id: "pcat_z",
      locale: "da",
      version: 1,
      body_json: { type: "doc", content: [] },
      seo_title: "Meta",
      status: "published",
    })
  })
})

describe("PATCH /admin/category-content/:id (cms row id)", () => {
  it("upserts by row keys and returns read payload at 200", async () => {
    const listCategoryContents = vi.fn(async () => [
      {
        id: "cc_row",
        category_id: "pcat_z",
        locale: "da",
        version: 2,
        body_json: null,
        seo_title: null,
        seo_description: null,
        og_image_url: null,
        banner_image_url: null,
        status: "draft" as const,
      },
    ])
    const upsertCategoryContent = vi.fn(async () => ({
      id: "cc_row",
      category_id: "pcat_z",
      locale: "da",
      version: 3,
      cms_status: "published" as const,
      description_rich: { type: "doc", content: [{ type: "paragraph" }] },
      seo_title: "Next",
      seo_description: null,
      seo_og_image_id: null,
      banner_image_id: null,
      canonical_url_override: null,
    }))

    const retrieveFile = vi.fn()

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      params: { id: "cc_row" },
      body: {
        description_rich: { type: "doc", content: [{ type: "paragraph" }] },
        seo_title: "Next",
      },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return {
              listCategoryContents,
              upsertCategoryContent,
            } as unknown as Pick<
              ContentModuleService,
              "listCategoryContents" | "upsertCategoryContent"
            >
          }
          if (key === Modules.FILE) {
            return { retrieveFile } as unknown as IFileModuleService
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await adminCategoryContentPatch(req, res)

    expect(listCategoryContents).toHaveBeenCalledWith({ id: "cc_row" })
    expect(upsertCategoryContent).toHaveBeenCalledWith("pcat_z", "da", {
      description_rich: { type: "doc", content: [{ type: "paragraph" }] },
      seo_title: "Next",
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(resJson.mock.calls[0]?.[0]).toMatchObject({
      version: 3,
      seo_title: "Next",
      status: "published",
    })
  })
})
