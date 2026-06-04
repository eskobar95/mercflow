import { model } from "@medusajs/framework/utils"

export const MercflowRedirect = model
  .define("mercflow_redirect", {
    id: model.id().primaryKey(),
    store_id: model.text().index("IDX_mercflow_redirect_store_id"),
    from_path: model.text(),
    to_path: model.text(),
    type: model.text().default("manual"),
  })
  .indexes([
    {
      name: "IDX_mercflow_redirect_from_path_store_unique",
      on: ["from_path", "store_id"],
      unique: true,
    },
  ])
