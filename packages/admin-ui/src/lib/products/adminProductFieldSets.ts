/**
 * Medusa Admin `fields` strings for consistent product payloads.
 * See API docs on field selection (`*relation`, `+computed`).
 */
export const ADMIN_PRODUCT_LIST_FIELDS =
  "id,title,status,thumbnail,subtitle,updated_at,*variants,+variants.inventory_quantity,+variants.prices,+variants.sku"

export const ADMIN_PRODUCT_DETAIL_FIELDS =
  "id,title,handle,status,subtitle,description,thumbnail,discountable,updated_at,metadata," +
  "material,weight,length,height,width,hs_code,mid_code,origin_country," +
  "*images,*options,+options.id,+options.title,*options.values,+options.values.value," +
  "*variants,+variants.id,+variants.title,+variants.sku,+variants.barcode,+variants.ean,+variants.upc," +
  "+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder," +
  "+variants.weight,+variants.length,+variants.height,+variants.width," +
  "+variants.material,+variants.hs_code,+variants.mid_code,+variants.origin_country," +
  "+variants.prices,+variants.calculated_price,*variants.options,+variants.options.option,+variants.options.value," +
  "*variants.inventory_items,+variants.inventory_items.inventory_item_id," +
  "*type,*collection,*categories,*tags,*sales_channels"
