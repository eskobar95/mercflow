import { model } from "@medusajs/framework/utils"

/**
 * Block payload lives in `data_json`. Field names should stay aligned with
 * PayloadCMS `sectionBlocks` (see Guapo `apps/cms/src/fields/sectionBlocks.ts`)
 * to simplify a future content migration.
 */
export const PageBlock = model.define("page_block", {
  id: model.id().primaryKey(),
  store_id: model.text().index("IDX_page_block_store_id"),
  page_version_id: model
    .text()
    .index("IDX_page_block_page_version_id"),
  sort_order: model.number(),
  block_type: model.text(),
  data_json: model.json().nullable(),
})
