import { model } from "@medusajs/framework/utils"

export const MercflowPurchaseOrderLine = model.define("mercflow_purchase_order_line", {
  id: model.id().primaryKey(),
  store_id: model.text().index("IDX_mercflow_purchase_order_line_store_id"),
  po_id: model.text().index("IDX_mercflow_purchase_order_line_po_id"),
  variant_id: model.text(),
  ordered_qty: model.number(),
  unit_cost: model.number(),
})
