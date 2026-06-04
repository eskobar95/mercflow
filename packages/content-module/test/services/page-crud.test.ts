import { MedusaError } from "@medusajs/utils"
import { describe, expect, it, vi } from "vitest"

import ContentModuleService from "../../src/modules/content/service"

describe("CMS page service (MER-32)", (): void => {
  it("adminCreatePage rejects duplicate slug for the same locale", async (): Promise<void> => {
    const listPages = vi.fn(async (filters: Record<string, unknown>) => {
      if (filters.slug === "about" && filters.locale === "en") {
        return [
          {
            id: "pg_existing",
            slug: "about",
            title: "X",
            page_type: "content",
            status: "draft",
            locale: "en",
          },
        ]
      }
      return []
    })
    const createPages = vi.fn()
    const svc = Object.assign(Object.create(ContentModuleService.prototype), {
      listPages,
      createPages,
    }) as ContentModuleService

    await expect(async (): Promise<void> => {
      await svc.adminCreatePage({
        title: "About",
        slug: "about",
        page_type: "content",
        status: "draft",
        locale: "en",
      })
    }).rejects.toThrow(MedusaError)

    expect(createPages).not.toHaveBeenCalled()
  })
})
