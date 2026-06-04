import { z } from "zod"

const idListSchema = z.array(z.string().min(1))

export const feedConfigPutBodySchema = z
  .object({
    storefront_url: z.string().nullable().optional(),
    excluded_product_ids: idListSchema.optional(),
    excluded_category_ids: idListSchema.optional(),
    default_condition: z.string().min(1).optional(),
  })
  .strict()

export const feedValidateQuerySchema = z.object({
  locale: z.string().min(1).optional(),
})
