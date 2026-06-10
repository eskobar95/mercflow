import { model } from "@medusajs/framework/utils"

export const MercflowShipmentPackaging = model
  .define("shipment_packaging", {
    id: model.id().primaryKey(),
    store_id: model.text(),
    fulfillment_id: model.text(),
    packaging_type_id: model.text(),
    dimensions_snapshot_json: model.json(),
  })
  .indexes([
    {
      name: "IDX_shipment_packaging_store_id",
      on: ["store_id"],
    },
    {
      name: "IDX_shipment_packaging_store_fulfillment",
      on: ["store_id", "fulfillment_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])
