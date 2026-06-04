import { model } from "@medusajs/framework/utils"

export const MercflowOrderNote = model.define("mercflow_order_note", {
  id: model.id().primaryKey(),
  store_id: model.text().index("IDX_mercflow_order_note_store_id"),
  order_id: model.text().index("IDX_mercflow_order_note_order_id"),
  content: model.text(),
  created_by: model.text(),
})
