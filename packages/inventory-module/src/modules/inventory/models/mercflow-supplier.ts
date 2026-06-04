import { model } from "@medusajs/framework/utils"

export const MercflowSupplier = model.define("mercflow_supplier", {
  id: model.id().primaryKey(),
  store_id: model.text().index("IDX_mercflow_supplier_store_id"),
  name: model.text(),
  contact_person: model.text().nullable(),
  email: model.text().nullable(),
  country: model.text().nullable(),
  currency: model.text().nullable(),
})
