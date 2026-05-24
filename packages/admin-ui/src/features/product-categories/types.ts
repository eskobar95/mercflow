/**
 * Narrow types for Medusa Admin product category payloads consumed by the Vite client.
 * @see GET /admin/product-categories
 */

export type AdminProductCategoryParsed = {
  id: string
  name: string
  handle: string
  /** Plain string from Medusa; may be empty. */
  description: string | null
  parent_category_id: string | null
  is_active: boolean
  rank: number | null
  created_at: string
  updated_at: string
  productCount: number
  parent_category: ParentCategorySummary | null
}

export type ParentCategorySummary = {
  id: string
  name: string
}

export type AdminProductCategoryHierarchyRow = {
  id: string
  name: string
  handle: string
  description: string | null
  productCount: number
  is_active: boolean
  updated_at: string
  /** 0 = root, 1 = direct child, … */
  depth: number
}
