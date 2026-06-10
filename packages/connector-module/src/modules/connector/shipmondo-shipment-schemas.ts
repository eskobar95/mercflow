import { z } from "zod"

/** POST /admin/connectors/shipmondo/shipments — create a Shipmondo label for a fulfillment. */
export const postShipmondoShipmentBodySchema = z
  .object({
    fulfillment_id: z.string().trim().min(1),
    packaging_type_id: z.union([z.string().trim().min(1), z.null()]).optional(),
  })
  .strict()

export type PostShipmondoShipmentBody = z.infer<typeof postShipmondoShipmentBodySchema>
