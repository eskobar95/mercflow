import { model } from "@medusajs/framework/utils"

export const MercflowPurchaseOrderReceipt = model.define("mercflow_purchase_order_receipt", {
  id: model.id().primaryKey(),
  store_id: model.text().index("IDX_mercflow_purchase_order_receipt_store_id"),
  line_id: model.text().index("IDX_mercflow_purchase_order_receipt_line_id"),
  received_qty: model.number(),
  received_at: model.dateTime(),
  notes: model.text().nullable(),
})
