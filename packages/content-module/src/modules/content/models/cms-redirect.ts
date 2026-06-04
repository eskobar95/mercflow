import { model } from "@medusajs/framework/utils"

export const CmsRedirect = model
  .define("cms_redirect", {
    id: model.id().primaryKey(),
    store_id: model.text().index("IDX_cms_redirect_store_id"),
    from_path: model.text(),
    to_path: model.text(),
  })
  .indexes([
    {
      name: "IDX_cms_redirect_from_path_store_unique",
      on: ["from_path", "store_id"],
      unique: true,
    },
  ])
