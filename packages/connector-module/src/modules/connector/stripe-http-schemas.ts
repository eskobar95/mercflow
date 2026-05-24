import { z } from "zod"

export const stripeVatModeSchema = z.enum(["inclusive", "exclusive"])

export type StripeConnectorPatchBody = z.infer<typeof stripeConnectorPatchSchema>

export const stripeConnectorPatchSchema = z
  .object({
    secret_key: z.string().min(8).optional(),
    publishable_key: z.string().min(8).optional(),
    webhook_secret: z.string().min(8).optional(),
    vat_mode: stripeVatModeSchema.optional(),
    active: z.boolean().optional(),
  })
  .strict()

