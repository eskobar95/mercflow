import { describe, expect, it, vi } from "vitest"

import { resolveCategoryAncestorIds } from "../src/api/http/resolve-category-ancestor-ids"

describe("resolveCategoryAncestorIds", (): void => {
  it("walks parent_category_id chain including self", async (): Promise<void> => {
    const graph = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ id: "child", parent_category_id: "parent" }] })
      .mockResolvedValueOnce({ data: [{ id: "parent", parent_category_id: null }] })

    const req = {
      scope: {
        resolve: () => ({ graph }),
      },
    }

    const ids = await resolveCategoryAncestorIds(req as never, "child")
    expect(ids).toEqual(["child", "parent"])
    expect(graph).toHaveBeenCalledTimes(2)
  })
})
