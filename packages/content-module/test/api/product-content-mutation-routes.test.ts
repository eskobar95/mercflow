import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IFileModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/framework/utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { POST as adminProductContentPost } from "../../src/api/admin/product-content/route"
import { PATCH as adminProductContentPatch } from "../../src/api/admin/product-content/[id]/route"
import { CONTENT_MODULE } from "../../src/modules/content"
import type ContentModuleService from "../../src/modules/content/service"

vi.mock("@medusajs/framework/http", async (orig) => {
  const actual = await orig<(typeof import("@medusajs/framework/http"))>()
  return {
    ...actual,
    refetchEntity: vi.fn(async () => ({
      id: "prod_z",
      status: "published",
    })),
  }
})

describe("POST /admin/product-content", () => {
  beforeEach(async () => {
    const http = await import("@medusajs/framework/http")
    vi.mocked(http.refetchEntity).mockResolvedValue({
      id: "prod_z",
      status: "published",
    })
  })

  it("upserts product content and returns read payload at 200", async () => {
    const upsertProductContent = vi.fn(async () => ({
      id: "pc_new",
      product_id: "prod_z",
      locale: "da",
      version: 1,
      description_rich: { type: "doc", content: [] },
      seo_title: "Meta",
      seo_description: "Hi",
      seo_og_image_id: "https://example.com/og.png",
      media_gallery: null,
    }))

    const retrieveFile = vi.fn()

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      query: { locale: "da" },
      body: {
        product_id: "prod_z",
        description_rich: { type: "doc", content: [] },
        seo_title: "Meta",
        seo_description: "Hi",
        seo_og_image_id: "https://example.com/og.png",
      },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { upsertProductContent } satisfies Pick<
              ContentModuleService,
              "upsertProductContent"
            >
          }
          if (key === Modules.FILE) {
            return { retrieveFile } as unknown as IFileModuleService
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await adminProductContentPost(req, res)

    expect(upsertProductContent).toHaveBeenCalledWith(
      "prod_z",
      "da",
      expect.objectContaining({
        description_rich: { type: "doc", content: [] },
        seo_title: "Meta",
        seo_description: "Hi",
        seo_og_image_id: "https://example.com/og.png",
      })
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(resJson.mock.calls[0]?.[0]).toMatchObject({
      id: "pc_new",
      product_id: "prod_z",
      locale: "da",
      version: 1,
      body_json: { type: "doc", content: [] },
      seo_title: "Meta",
      og_image_url: "https://example.com/og.png",
      status: "published",
    })
  })
})

describe("PATCH /admin/product-content/:id (cms row id)", () => {
  it("upserts by row keys and returns read payload at 200", async () => {
    const listProductContents = vi.fn(async () => [
      {
        id: "pc_row",
        product_id: "prod_z",
        locale: "da",
        version: 2,
        body_json: null,
        seo_title: null,
        seo_description: null,
        og_image_url: null,
        status: "draft",
      },
    ])
    const upsertProductContent = vi.fn(async () => ({
      id: "pc_row",
      product_id: "prod_z",
      locale: "da",
      version: 3,
      description_rich: { type: "doc", content: [{ type: "paragraph" }] },
      seo_title: "Next",
      seo_description: null,
      seo_og_image_id: null,
      media_gallery: null,
    }))

    const retrieveFile = vi.fn()

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      params: { id: "pc_row" },
      body: {
        description_rich: { type: "doc", content: [{ type: "paragraph" }] },
        seo_title: "Next",
      },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return {
              listProductContents,
              upsertProductContent,
            } as unknown as Pick<
              ContentModuleService,
              "listProductContents" | "upsertProductContent"
            >
          }
          if (key === Modules.FILE) {
            return { retrieveFile } as unknown as IFileModuleService
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await adminProductContentPatch(req, res)

    expect(listProductContents).toHaveBeenCalledWith({ id: "pc_row" })
    expect(upsertProductContent).toHaveBeenCalledWith("prod_z", "da", {
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
