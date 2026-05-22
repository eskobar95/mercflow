import { model } from "@medusajs/framework/utils"

/**
 * Editorial page (homepage / landing / content). Persisted as table `"page"`.
 */
export const MercflowPage = model
  .define("page", {
    id: model.id().primaryKey(),
    slug: model.text(),
    title: model.text(),
    page_type: model.enum(["homepage", "landing", "content"]),
    status: model.enum(["draft", "published"]).default("draft"),
    locale: model.text(),
  })
  .indexes([
    {
      name: "IDX_page_slug_locale_unique",
      on: ["slug", "locale"],
      unique: true,
    },
  ])
