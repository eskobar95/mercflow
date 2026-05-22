import { model } from "@medusajs/framework/utils"

/**
 * Serialized blocks for a specific saved `page_version` (`data_json` mirrors PayloadCMS
 * section block field names — see Guapo `apps/cms/src/fields/sectionBlocks.ts`).
 */
export const PageBlock = model.define("page_block", {
  id: model.id().primaryKey(),
  page_version_id: model.text().index("IDX_page_block_page_version_id"),
  sort_order: model.number().default(0),
  block_type: model.text(),
  data_json: model.json().nullable(),
})
