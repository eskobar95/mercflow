import { model } from "@medusajs/framework/utils"

export const MercflowPackagingType = model
  .define("packaging_types", {
    id: model.id().primaryKey(),
    store_id: model.text(),
    name: model.text(),
    type: model.enum(["box", "envelope", "bag", "tube", "other"]),
    length_mm: model.number(),
    width_mm: model.number(),
    height_mm: model.number(),
    max_weight_g: model.number(),
    is_active: model.boolean().default(true),
  })
  .indexes([
    {
      name: "IDX_packaging_types_store_id",
      on: ["store_id"],
    },
    {
      name: "IDX_packaging_types_store_name",
      on: ["store_id", "name"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])
