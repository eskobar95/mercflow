import { z } from "zod"

export const slugStrategySchema = z.enum(["nordic", "omit"])

export const seoConfigBodySchema = z
  .object({
    storefront_url: z.string().url().nullable().optional(),
    slug_strategy: slugStrategySchema.optional(),
    org_name: z.string().max(255).nullable().optional(),
    org_logo_url: z.string().url().nullable().optional(),
    org_social_urls: z.record(z.unknown()).nullable().optional(),
  })
  .strict()

export const redirectBodySchema = z
  .object({
    from_path: z.string().min(1).max(2048),
    to_path: z.string().min(1).max(2048),
    type: z.enum(["auto", "manual"]).optional(),
  })
  .strict()

export const storeIdQuerySchema = z.object({
  store_id: z
    .string()
    .regex(/^store_[0-9A-Z]+$/)
    .optional(),
})
