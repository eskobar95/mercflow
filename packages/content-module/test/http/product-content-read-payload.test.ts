import type { MedusaContainer } from "@medusajs/framework/types"
import type { IFileModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/framework/utils"
import { describe, expect, it, vi } from "vitest"

import { mapResolvedToReadPayload } from "../../src/api/http/product-content-read-payload"
import type { ResolvedProductContent } from "../../src/modules/content/types"

function buildResolved(overrides: Partial<ResolvedProductContent> = {}): ResolvedProductContent {
  return {
    id: "pc_1",
    product_id: "prod_1",
    locale: "da",
    description_rich: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hej" }] }] },
    seo_title: "Title",
    seo_description: "Desc",
    seo_og_image_id: "file_1",
    media_gallery: null,
    ...overrides,
  }
}

describe("mapResolvedToReadPayload", () => {
  it("maps fields and resolves og image url via file module", async () => {
    const retrieveFile = vi.fn(async () => ({
      id: "file_1",
      url: "https://example.com/img.png",
    }))

    const scope = {
      resolve: vi.fn((key: unknown) => {
        if (key === Modules.FILE) {
          return { retrieveFile } as unknown as IFileModuleService
        }
        throw new Error(`unexpected resolve(${String(key)})`)
      }),
    } as unknown as MedusaContainer

    const out = await mapResolvedToReadPayload(scope, buildResolved(), "published")
    expect(out).toMatchObject({
      body_json: buildResolved().description_rich,
      seo_title: "Title",
      seo_description: "Desc",
      og_image_url: "https://example.com/img.png",
      status: "published",
      locale: "da",
    })
    expect(retrieveFile).toHaveBeenCalledWith("file_1")
  })

  it("falls back og_image_url when file lookup fails", async () => {
    const scope = {
      resolve: vi.fn(() => {
        throw new Error("no FILE module registered")
      }),
    } as unknown as MedusaContainer

    const out = await mapResolvedToReadPayload(scope, buildResolved({ seo_og_image_id: "missing" }), "draft")
    expect(out.og_image_url).toBeNull()
    expect(out.status).toBe("draft")
  })
})
