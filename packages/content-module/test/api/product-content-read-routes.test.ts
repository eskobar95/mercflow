import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IFileModuleService, IProductModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/framework/utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET as adminProductContentGet } from "../../src/api/admin/product-content/[id]/route"
import { GET as storeProductContentGet } from "../../src/api/store/product-content/[handle]/route"
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

describe("GET /admin/product-content/:id (product lookup)", () => {
  beforeEach(async () => {
    const http = await import("@medusajs/framework/http")
    vi.mocked(http.refetchEntity).mockResolvedValue({
      id: "prod_z",
      status: "published",
    })
  })

  it("returns read payload JSON at 200", async () => {
    const retrieveFile = vi.fn(async (): Promise<{ id: string; url: string }> => ({
      id: "f1",
      url: "https://example.com/files/f1.bin",
    }))

    const findByProductId = vi.fn(async () => ({
      id: "pc",
      product_id: "prod_z",
      locale: "da",
      version: 3,
      description_rich: { type: "doc", content: [] },
      seo_title: "SEO",
      seo_description: null,
      seo_og_image_id: "f1",
      media_gallery: null,
    }))

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      params: { id: "prod_z" },
      query: { locale: "da" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { findByProductId } satisfies Pick<ContentModuleService, "findByProductId">
          }
          if (key === Modules.FILE) {
            return { retrieveFile } as unknown as IFileModuleService
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await adminProductContentGet(req, res)

    expect(findByProductId).toHaveBeenCalledWith("prod_z", "da")
    expect(res.status).toHaveBeenCalledWith(200)
    expect(resJson.mock.calls[0]?.[0]).toMatchObject({
      id: "pc",
      product_id: "prod_z",
      locale: "da",
      version: 3,
      seo_title: "SEO",
      og_image_url: "https://example.com/files/f1.bin",
      status: "published",
    })
  })
})

describe("GET /store/product-content/:handle", () => {
  it("loads published products by handle and returns read payload JSON", async () => {
    const retrieveFile = vi.fn(async (): Promise<{ id: string; url: string }> => ({
      id: "f1",
      url: "https://cdn.example.com/x.png",
    }))

    const listProducts = vi.fn(async () => [{ id: "prod_z", status: "published" as const }])
    const findByProductId = vi.fn(async () => ({
      id: "pc",
      product_id: "prod_z",
      locale: "en",
      version: 1,
      description_rich: null,
      seo_title: null,
      seo_description: "desc",
      seo_og_image_id: "f1",
      media_gallery: null,
    }))

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      params: { handle: "coffee-mug" },
      query: { locale: "en" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === Modules.PRODUCT) {
            return {
              listProducts,
            } as unknown as Pick<IProductModuleService, "listProducts">
          }
          if (key === CONTENT_MODULE) {
            return { findByProductId } satisfies Pick<ContentModuleService, "findByProductId">
          }
          if (key === Modules.FILE) {
            return { retrieveFile } as unknown as IFileModuleService
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await storeProductContentGet(req, res)

    expect(listProducts).toHaveBeenCalledWith({ handle: "coffee-mug" }, { take: 2 })
    expect(findByProductId).toHaveBeenCalledWith("prod_z", "en")
    expect(res.status).toHaveBeenCalledWith(200)
    expect(resJson.mock.calls[0]?.[0]).toMatchObject({
      locale: "en",
      status: "published",
      seo_description: "desc",
      og_image_url: "https://cdn.example.com/x.png",
    })
  })
})
