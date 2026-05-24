import { describe, expect, it } from "vitest"

import { collectSelfAndDescendantCategoryIds } from "./collectCategoryDescendants"
import type { AdminProductCategoryParsed } from "./types"

function cat(
  partial: Pick<AdminProductCategoryParsed, "id" | "parent_category_id">
): AdminProductCategoryParsed {
  return {
    id: partial.id,
    parent_category_id: partial.parent_category_id ?? null,
    name: partial.id,
    handle: partial.id,
    description: null,
    is_active: true,
    rank: null,
    created_at: "2020-01-01",
    updated_at: "2020-01-01",
    productCount: 0,
    parent_category: null,
  }
}

describe("collectSelfAndDescendantCategoryIds", (): void => {
  it("collects self plus nested children", (): void => {
    const tree: AdminProductCategoryParsed[] = [
      cat({ id: "a", parent_category_id: null }),
      cat({ id: "b", parent_category_id: "a" }),
      cat({ id: "c", parent_category_id: "b" }),
      cat({ id: "sibling", parent_category_id: "a" }),
    ]
    const out = collectSelfAndDescendantCategoryIds(tree, "a")
    expect(out.has("a")).toBe(true)
    expect(out.has("b")).toBe(true)
    expect(out.has("c")).toBe(true)
    expect(out.has("sibling")).toBe(true)
  })

  it("excludes unrelated branches", (): void => {
    const tree: AdminProductCategoryParsed[] = [
      cat({ id: "root", parent_category_id: null }),
      cat({ id: "other", parent_category_id: null }),
    ]
    const out = collectSelfAndDescendantCategoryIds(tree, "root")
    expect(out.has("root")).toBe(true)
    expect(out.has("other")).toBe(false)
  })
})
