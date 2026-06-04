import { describe, expect, it, vi } from "vitest"

import ContentModuleService from "../../src/modules/content/service"

describe("ContentModuleService article helpers", () => {
  it("createArticle allocates slug when base is taken", async () => {
    const listSpy = vi
      .spyOn(ContentModuleService.prototype as { listArticles: () => Promise<unknown[]> }, "listArticles")
      .mockResolvedValueOnce([{ id: "other", slug: "hello", locale: "en" }])
      .mockResolvedValueOnce([])

    const createSpy = vi
      .spyOn(
        ContentModuleService.prototype as { createArticles: (arg: unknown) => Promise<unknown[]> },
        "createArticles"
      )
      .mockResolvedValue([
        {
          id: "new",
          slug: "hello-2",
          title: "Hello",
          body_json: null,
          locale: "en",
          status: "draft",
          published_at: null,
        },
      ])

    const svc = Object.create(ContentModuleService.prototype) as ContentModuleService
    const row = await svc.createArticle({ title: "Hello", locale: "en" })

    expect(listSpy).toHaveBeenCalled()
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "hello-2", title: "Hello" })
    )
    expect(row.slug).toBe("hello-2")

    listSpy.mockRestore()
    createSpy.mockRestore()
  })
})
