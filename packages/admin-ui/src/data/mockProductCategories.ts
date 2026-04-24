/**
 * Static mock data for the Product category list. When Medusa is connected,
 * fetch categories via the Admin API and map to `ProductCategoryListRow` (or
 * adapt column defs to the API response) in the page.
 */
export type ProductCategoryListRow = {
  id: string
  name: string
  /** URL handle / slug, aligned with Medusa `handle`. */
  handle: string
  productCount: number
  updatedAt: string
}

export const MOCK_PRODUCT_CATEGORIES: ProductCategoryListRow[] = [
  {
    id: "pc_1",
    name: "Apparel",
    handle: "apparel",
    productCount: 5,
    updatedAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "pc_2",
    name: "Footwear",
    handle: "footwear",
    productCount: 1,
    updatedAt: "2026-01-20T10:00:00.000Z",
  },
  {
    id: "pc_3",
    name: "Bags & Travel",
    handle: "bags-travel",
    productCount: 3,
    updatedAt: "2026-02-01T10:00:00.000Z",
  },
  {
    id: "pc_4",
    name: "Home",
    handle: "home",
    productCount: 2,
    updatedAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "pc_5",
    name: "Kitchen",
    handle: "kitchen",
    productCount: 3,
    updatedAt: "2026-02-20T10:00:00.000Z",
  },
  {
    id: "pc_6",
    name: "Accessories",
    handle: "accessories",
    productCount: 2,
    updatedAt: "2025-12-05T10:00:00.000Z",
  },
  {
    id: "pc_7",
    name: "Wellness",
    handle: "wellness",
    productCount: 1,
    updatedAt: "2026-03-01T10:00:00.000Z",
  },
  {
    id: "pc_8",
    name: "Archive",
    handle: "archive",
    productCount: 0,
    updatedAt: "2024-06-01T10:00:00.000Z",
  },
  {
    id: "pc_9",
    name: "New arrivals",
    handle: "new-arrivals",
    productCount: 4,
    updatedAt: "2026-03-18T10:00:00.000Z",
  },
  {
    id: "pc_10",
    name: "Sale",
    handle: "sale",
    productCount: 2,
    updatedAt: "2026-02-28T10:00:00.000Z",
  },
  {
    id: "pc_11",
    name: "Gifts",
    handle: "gifts",
    productCount: 0,
    updatedAt: "2025-11-20T10:00:00.000Z",
  },
  {
    id: "pc_12",
    name: "Lifestyle",
    handle: "lifestyle",
    productCount: 1,
    updatedAt: "2025-10-10T10:00:00.000Z",
  },
]
