import { MedusaError } from "@medusajs/utils"
import { describe, expect, it, vi } from "vitest"

import ContentModuleService from "../../src/modules/content/service"

type StubService = Omit<
  ContentModuleService,
  "listCategoryContents" | "createCategoryContents" | "updateCategoryContents"
> & {
  listCategoryContents: (filters: Record<string, unknown>) => Promise<unknown[]>
  createCategoryContents: (data: Record<string, unknown>) => Promise<unknown[]>
  updateCategoryContents: (data: Record<string, unknown>) => Promise<unknown>
}

describe("upsertCategoryContent validation", (): void => {
  it("rejects seo_title exceeding 255 characters", async (): Promise<void> => {
    const svc = Object.create(ContentModuleService.prototype) as StubService
    svc.listCategoryContents = vi.fn(async (): Promise<unknown[]> => [])

    const longTitle = "x".repeat(256)

    await expect(async (): Promise<void> => {
      await svc.upsertCategoryContent("pcat_z", "da", { seo_title: longTitle })
    }).rejects.toThrow(MedusaError)
  })
})

describe("upsertCategoryContent persistence", (): void => {
  it("creates a locale row when none exists", async (): Promise<void> => {
    const createdRow = {
      id: "new_row",
      category_id: "pcat_z",
      locale: "da",
      version: 1,
      cms_status: "published" as const,
      description_rich: { type: "doc", content: [] },
      seo_title: "Hi",
      seo_description: null,
      seo_og_image_id: null,
      banner_image_id: null,
    }

    const svc = Object.create(ContentModuleService.prototype) as StubService
    svc.listCategoryContents = vi.fn(async (): Promise<unknown[]> => [])
    svc.createCategoryContents = vi.fn(
      async (data: Record<string, unknown>): Promise<unknown[]> => [
        {
          ...data,
          id: createdRow.id,
          version: 1,
          status: "published",
          body_json: data.body_json ?? null,
          seo_title: data.seo_title ?? null,
          seo_description: data.seo_description ?? null,
          og_image_url: data.og_image_url ?? null,
          banner_image_url: data.banner_image_url ?? null,
        },
      ]
    )

    const result = await svc.upsertCategoryContent("pcat_z", "da", {
      description_rich: { type: "doc", content: [] },
      seo_title: "Hi",
    })

    expect(svc.createCategoryContents).toHaveBeenCalled()
    expect(result).toMatchObject({
      id: createdRow.id,
      category_id: "pcat_z",
      locale: "da",
      seo_title: "Hi",
    })
  })
})
