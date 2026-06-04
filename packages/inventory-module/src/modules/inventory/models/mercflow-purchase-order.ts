import { model } from "@medusajs/framework/utils"

export const MercflowPurchaseOrder = model.define("mercflow_purchase_order", {
  id: model.id().primaryKey(),
  store_id: model.text().index("IDX_mercflow_purchase_order_store_id"),
  supplier_id: model.text().index("IDX_mercflow_purchase_order_supplier_id"),
  status: model.text().default("draft"),
  expected_date: model.dateTime().nullable(),
  reference: model.text().nullable(),
  notes: model.text().nullable(),
})
