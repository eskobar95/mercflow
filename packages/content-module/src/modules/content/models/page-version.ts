import { model } from "@medusajs/framework/utils"

/**
 * Saved versions of an editorial page. `snapshot_json` can store denormalised tree for rollback.
 */
export const PageVersion = model
  .define("page_version", {
    id: model.id().primaryKey(),
    page_id: model.text().index("IDX_page_version_page_id"),
    version: model.number(),
    status: model.enum(["draft", "published"]).default("draft"),
    snapshot_json: model.json().nullable(),
    published_at: model.dateTime().nullable(),
  })
  .indexes([
    {
      name: "IDX_page_version_page_version_unique",
      on: ["page_id", "version"],
      unique: true,
    },
  ])
