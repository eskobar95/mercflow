import { describe, expect, it } from "vitest"

import { buildHierarchyRowsFromCategories } from "./buildHierarchyRows"
import type { AdminProductCategoryParsed } from "./types"

function mk(overrides: Partial<AdminProductCategoryParsed>): AdminProductCategoryParsed {
  return {
    id: "default",
    name: "Root",
    handle: "root",
    description: null,
    parent_category_id: null,
    is_active: true,
    rank: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    productCount: 0,
    parent_category: null,
    ...overrides,
  }
}

describe("buildHierarchyRowsFromCategories", () => {
  it("renders roots before children depth-first", () => {
    const rows = buildHierarchyRowsFromCategories([
      mk({
        id: "child-a",
        name: "Child A",
        handle: "child-a",
        parent_category_id: "parent",
      }),
      mk({
        id: "parent",
        name: "Parent",
        handle: "parent",
        rank: null,
      }),
    ])

    expect(rows.map((r) => r.name)).toEqual(["Parent", "Child A"])
    expect(rows.map((r) => r.depth)).toEqual([0, 1])
  })

  it("promotes missing parents to roots", () => {
    const rows = buildHierarchyRowsFromCategories([
      mk({
        id: "orphan",
        name: "Orphan",
        handle: "orphan",
        parent_category_id: "missing",
      }),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]?.depth).toBe(0)
  })
})
