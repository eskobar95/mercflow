/**
 * Medusa Admin `fields` strings for consistent product payloads.
 * See API docs on field selection (`*relation`, `+computed`).
 */
export const ADMIN_PRODUCT_LIST_FIELDS =
  "id,title,status,thumbnail,subtitle,updated_at,*variants,+variants.inventory_quantity,+variants.prices,+variants.sku"

export const ADMIN_PRODUCT_DETAIL_FIELDS =
  "id,title,handle,status,subtitle,description,thumbnail,updated_at,*images,*variants,+variants.title,+variants.sku,+variants.inventory_quantity,+variants.manage_inventory,+variants.prices,+variants.calculated_price"
