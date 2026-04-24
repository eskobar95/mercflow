/**
 * Static mock data for the Product list. Replace with Medusa Admin list queries
 * (e.g. `useAdminProductList` or SDK) when the backend is wired; keep the same
 * row shape or map DTOs into `ProductListRow` in the page layer.
 */
export type ProductListRow = {
  id: string
  title: string
  status: "draft" | "published" | "proposed"
  collection: string
  sku: string
  updatedAt: string
}

export const MOCK_PRODUCTS: ProductListRow[] = [
  {
    id: "prod_1",
    title: "Aurora running shoes",
    status: "published",
    collection: "Footwear",
    sku: "FOOT-AUR-42",
    updatedAt: "2026-01-20T10:00:00.000Z",
  },
  {
    id: "prod_2",
    title: "Canvas tote (medium)",
    status: "draft",
    collection: "Bags",
    sku: "BAG-CAN-M",
    updatedAt: "2026-02-14T12:15:00.000Z",
  },
  {
    id: "prod_3",
    title: "Merino beanie",
    status: "published",
    collection: "Apparel",
    sku: "APP-BEA-OS",
    updatedAt: "2025-12-01T08:00:00.000Z",
  },
  {
    id: "prod_4",
    title: "Recycled cap",
    status: "proposed",
    collection: "Apparel",
    sku: "APP-CAP-OS",
    updatedAt: "2025-11-10T16:20:00.000Z",
  },
  {
    id: "prod_5",
    title: "Trail backpack 28L",
    status: "draft",
    collection: "Bags",
    sku: "BAG-TR-28",
    updatedAt: "2026-03-01T09:00:00.000Z",
  },
  {
    id: "prod_6",
    title: "Linen table runner",
    status: "published",
    collection: "Home",
    sku: "HOM-LTR-1",
    updatedAt: "2026-01-30T11:00:00.000Z",
  },
  {
    id: "prod_7",
    title: "Glass water bottle 750ml",
    status: "draft",
    collection: "Kitchen",
    sku: "KIT-GL-75",
    updatedAt: "2026-02-28T14:00:00.000Z",
  },
  {
    id: "prod_8",
    title: "Ceramic pour-over set",
    status: "published",
    collection: "Kitchen",
    sku: "KIT-PO-1",
    updatedAt: "2026-02-10T10:00:00.000Z",
  },
  {
    id: "prod_9",
    title: "Travel pouch set",
    status: "draft",
    collection: "Bags",
    sku: "BAG-TP-3",
    updatedAt: "2026-03-15T10:00:00.000Z",
  },
  {
    id: "prod_10",
    title: "Kids rain jacket",
    status: "published",
    collection: "Apparel",
    sku: "APP-RJ-8",
    updatedAt: "2026-02-20T10:00:00.000Z",
  },
  {
    id: "prod_11",
    title: "Cotton t-shirt (unisex)",
    status: "draft",
    collection: "Apparel",
    sku: "APP-TM-L",
    updatedAt: "2026-02-12T10:00:00.000Z",
  },
  {
    id: "prod_12",
    title: "Leather card holder",
    status: "published",
    collection: "Accessories",
    sku: "ACC-CR-1",
    updatedAt: "2026-01-05T10:00:00.000Z",
  },
  {
    id: "prod_13",
    title: "Sunglasses polarized",
    status: "proposed",
    collection: "Accessories",
    sku: "ACC-SG-1",
    updatedAt: "2025-10-20T10:00:00.000Z",
  },
  {
    id: "prod_14",
    title: "Yoga mat 5mm",
    status: "draft",
    collection: "Wellness",
    sku: "WEL-YM-5",
    updatedAt: "2026-03-18T10:00:00.000Z",
  },
  {
    id: "prod_15",
    title: "Insulated meal jar",
    status: "published",
    collection: "Kitchen",
    sku: "KIT-MJ-1",
    updatedAt: "2026-02-22T10:00:00.000Z",
  },
  {
    id: "prod_16",
    title: "Wool throw blanket",
    status: "draft",
    collection: "Home",
    sku: "HOM-TB-1",
    updatedAt: "2026-01-10T10:00:00.000Z",
  },
]
