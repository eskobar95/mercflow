import { model } from "@medusajs/framework/utils"

export const Page = model.define("page", {
  id: model.id().primaryKey(),
  slug: model.text(),
  title: model.text(),
  page_type: model.enum(["homepage", "landing", "content"]),
  status: model.enum(["draft", "published"]).default("draft"),
  locale: model.text(),
})
