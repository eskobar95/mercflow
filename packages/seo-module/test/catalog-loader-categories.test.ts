import { describe, expect, it, vi } from "vitest"

import { loadCategories } from "../src/modules/seo/catalog-loader"

describe("loadCategories", (): void => {
  it("scopes categories to products in the store sales channels", async (): Promise<void> => {
    const graph = vi.fn(async (input: {
      entity: string
      filters?: Record<string, unknown>
    }) => {
      expect(input.entity).toBe("product_category")
      expect(input.filters).toEqual({
        products: {
          sales_channels: { id: ["sc_a"] },
        },
      })
      return {
        data: [
          {
            id: "cat_1",
            handle: "shoes",
            is_active: true,
            is_internal: false,
            updated_at: "2026-01-01T00:00:00.000Z",
          },
          {
            id: "cat_2",
            handle: "internal",
            is_active: true,
            is_internal: true,
            updated_at: "2026-01-01T00:00:00.000Z",
          },
        ],
        metadata: { take: 50 },
      }
    })

    const categories = await loadCategories(graph, ["sc_a"])
    expect(categories).toEqual([
      {
        id: "cat_1",
        handle: "shoes",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ])
  })

  it("returns empty when no sales channels", async (): Promise<void> => {
    const graph = vi.fn()
    const categories = await loadCategories(graph, [])
    expect(categories).toEqual([])
    expect(graph).not.toHaveBeenCalled()
  })
})
