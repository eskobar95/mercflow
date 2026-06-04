import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IFileModuleService, IProductModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GET as adminCategoryContentGet } from "../../src/api/admin/category-content/[id]/route"
import { GET as storeCategoryContentGet } from "../../src/api/store/category-content/[handle]/route"
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

describe("GET /admin/category-content/:id (category lookup)", () => {
  beforeEach(async () => {
    const http = await import("@medusajs/framework/http")
    vi.mocked(http.refetchEntity).mockResolvedValue({
      id: "pcat_z",
      is_active: true,
      is_internal: false,
    })
  })

  it("returns read payload JSON at 200", async () => {
    const retrieveFile = vi.fn(async (): Promise<{ id: string; url: string }> => ({
      id: "f1",
      url: "https://example.com/files/f1.bin",
    }))

    const findByCategoryId = vi.fn(async () => ({
      id: "cc",
      category_id: "pcat_z",
      locale: "da",
      version: 2,
      cms_status: "published" as const,
      description_rich: { type: "doc", content: [] },
      seo_title: "SEO",
      seo_description: null,
      seo_og_image_id: "f1",
      banner_image_id: null,
    }))

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      params: { id: "pcat_z" },
      query: { locale: "da" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === CONTENT_MODULE) {
            return { findByCategoryId } satisfies Pick<ContentModuleService, "findByCategoryId">
          }
          if (key === Modules.FILE) {
            return { retrieveFile } as unknown as IFileModuleService
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await adminCategoryContentGet(req, res)

    expect(findByCategoryId).toHaveBeenCalledWith("pcat_z", "da")
    expect(res.status).toHaveBeenCalledWith(200)
    expect(resJson.mock.calls[0]?.[0]).toMatchObject({
      id: "cc",
      category_id: "pcat_z",
      locale: "da",
      version: 2,
      seo_title: "SEO",
      og_image_url: "https://example.com/files/f1.bin",
      status: "published",
    })
  })
})

describe("GET /store/category-content/:handle", () => {
  it("loads active categories by handle and returns read payload JSON", async () => {
    const retrieveFile = vi.fn(async (): Promise<{ id: string; url: string }> => ({
      id: "f1",
      url: "https://cdn.example.com/x.png",
    }))

    const listProductCategories = vi.fn(async () => [
      { id: "pcat_z", is_active: true, is_internal: false },
    ])
    const findByCategoryId = vi.fn(async () => ({
      id: "cc",
      category_id: "pcat_z",
      locale: "en",
      version: 1,
      cms_status: "published" as const,
      description_rich: null,
      seo_title: null,
      seo_description: "desc",
      seo_og_image_id: "f1",
      banner_image_id: null,
    }))

    const resJson = vi.fn()
    const res = {
      status: vi.fn(() => ({ json: resJson })),
    } as unknown as MedusaResponse

    const req = {
      params: { handle: "electronics" },
      query: { locale: "en" },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === Modules.PRODUCT) {
            return {
              listProductCategories,
            } as unknown as Pick<IProductModuleService, never> & {
              listProductCategories: typeof listProductCategories
            }
          }
          if (key === CONTENT_MODULE) {
            return { findByCategoryId } satisfies Pick<ContentModuleService, "findByCategoryId">
          }
          if (key === Modules.FILE) {
            return { retrieveFile } as unknown as IFileModuleService
          }
          throw new Error(`unexpected resolve key "${key}"`)
        }),
      },
    } as unknown as MedusaRequest

    await storeCategoryContentGet(req, res)

    expect(listProductCategories).toHaveBeenCalledWith({ handle: "electronics" }, { take: 2 })
    expect(findByCategoryId).toHaveBeenCalledWith("pcat_z", "en")
    expect(res.status).toHaveBeenCalledWith(200)
    expect(resJson.mock.calls[0]?.[0]).toMatchObject({
      locale: "en",
      status: "published",
      seo_description: "desc",
      og_image_url: "https://cdn.example.com/x.png",
      banner_image_url: null,
    })
  })

  it("returns not found path when CMS row is draft", async () => {
    const listProductCategories = vi.fn(async () => [
      { id: "pcat_z", is_active: true, is_internal: false },
    ])
    const findByCategoryId = vi.fn(async () => ({
      id: "cc",
      category_id: "pcat_z",
      locale: "en",
      version: 1,
      cms_status: "draft" as const,
      description_rich: null,
      seo_title: null,
      seo_description: null,
      seo_og_image_id: null,
      banner_image_id: null,
    }))

    await expect(async () =>
      storeCategoryContentGet(
        {
          params: { handle: "electronics" },
          query: { locale: "en" },
          scope: {
            resolve: vi.fn((key: string) => {
              if (key === Modules.PRODUCT) {
                return { listProductCategories } as unknown
              }
              if (key === CONTENT_MODULE) {
                return { findByCategoryId } satisfies Pick<
                  ContentModuleService,
                  "findByCategoryId"
                >
              }
              throw new Error(`unexpected resolve key "${key}"`)
            }),
          },
        } as unknown as MedusaRequest,
        {} as MedusaResponse
      )
    ).rejects.toMatchObject({
      type: MedusaError.Types.NOT_FOUND,
    })
  })
})
