import { describe, expect, it, vi } from "vitest"

import type { ProductContentRecord } from "../../src/modules/content/types"
import ContentModuleService from "../../src/modules/content/service"

describe("ContentModuleService.upsertProductContent", () => {
  it("creates a row at version 1 when none exists for product and locale", async () => {
    const withTenant = vi.fn(
      async <T>(_storeId: string, fn: (context: Record<string, never>) => Promise<T>): Promise<T> =>
        fn({})
    )
    const listSpy = vi
      .spyOn(ContentModuleService.prototype as { listProductContents: () => Promise<unknown[]> }, "listProductContents")
      .mockResolvedValue([])
    const createSpy = vi
      .spyOn(ContentModuleService.prototype as { createProductContents: (arg: unknown) => Promise<ProductContentRecord[]> }, "createProductContents")
      .mockResolvedValue([
        {
          id: "pc_new",
          product_id: "prod_1",
          locale: "da",
          version: 1,
          body_json: { type: "doc", content: [] },
          seo_title: "T",
          seo_description: null,
          og_image_url: null,
          canonical_url_override: null,
          status: "published",
        } satisfies ProductContentRecord,
      ])

    const svc = Object.create(ContentModuleService.prototype) as ContentModuleService
    Object.assign(svc, { withTenant })
    const resolved = await svc.upsertProductContent(
      "prod_1",
      "da",
      {
        description_rich: { type: "doc", content: [] },
        seo_title: "T",
      },
      "store_test"
    )

    expect(withTenant).toHaveBeenCalledWith("store_test", expect.any(Function))
    expect(listSpy).toHaveBeenCalledWith({ product_id: "prod_1", locale: "da" }, {}, {})
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        store_id: "store_test",
        product_id: "prod_1",
        locale: "da",
        version: 1,
      }),
      {}
    )
    expect(resolved.version).toBe(1)

    createSpy.mockRestore()
    listSpy.mockRestore()
  })

  it("updates an existing row and bumps version by one", async () => {
    const withTenant = vi.fn(
      async <T>(_storeId: string, fn: (context: Record<string, never>) => Promise<T>): Promise<T> =>
        fn({})
    )
    const existing: ProductContentRecord = {
      id: "pc_ex",
      product_id: "prod_1",
      locale: "da",
      version: 4,
      body_json: { type: "doc", content: [] },
      seo_title: "Old",
      seo_description: null,
      og_image_url: null,
      canonical_url_override: null,
      status: "published",
    }

    const listSpy = vi
      .spyOn(ContentModuleService.prototype as { listProductContents: () => Promise<ProductContentRecord[]> }, "listProductContents")
      .mockResolvedValue([existing])
    const updateSpy = vi
      .spyOn(ContentModuleService.prototype as { updateProductContents: (arg: unknown) => Promise<ProductContentRecord[]> }, "updateProductContents")
      .mockResolvedValue([
        {
          ...existing,
          seo_title: "New",
          version: 5,
          status: "published",
        },
      ])

    const svc = Object.create(ContentModuleService.prototype) as ContentModuleService
    Object.assign(svc, { withTenant })
    const resolved = await svc.upsertProductContent(
      "prod_1",
      "da",
      {
        seo_title: "New",
      },
      "store_test"
    )

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "pc_ex",
        seo_title: "New",
        version: 5,
      }),
      {}
    )
    expect(resolved.version).toBe(5)

    updateSpy.mockRestore()
    listSpy.mockRestore()
  })
})
