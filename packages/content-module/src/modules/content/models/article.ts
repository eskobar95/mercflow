import { model } from "@medusajs/framework/utils"

export const Article = model
  .define("article", {
    id: model.id().primaryKey(),
    slug: model.text(),
    title: model.text(),
    body_json: model.json().nullable(),
    locale: model.text(),
    status: model.enum(["draft", "published"]).default("draft"),
    published_at: model.dateTime().nullable(),
  })
  .indexes([
    {
      name: "IDX_article_slug_locale_unique",
      on: ["slug", "locale"],
      unique: true,
    },
  ])
