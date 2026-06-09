export const GUAPO_BACKFILL_STORE_ID = "store_01KG0VBTT0714XV2CCTEBRVC47"

/** Physical table names verified against local Postgres (order line items → order_line_item). */
export const M0_CORE_TABLES = [
  "product",
  "product_variant",
  "product_category",
  "order",
  "customer",
  "order_line_item",
] as const

export type M0CoreTable = (typeof M0_CORE_TABLES)[number]
