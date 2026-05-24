import { z } from "zod"

const SEO_DESCRIPTION_MAX = 160

export const localeQuerySchema = z.object({
  locale: z
    .string()
    .min(1)
    .max(32)
    .optional()
    .default("en"),
})

export const productContentBodySchema = z
  .object({
    description_rich: z.unknown().optional(),
    seo_title: z.string().max(255).nullable().optional(),
    seo_description: z.string().max(SEO_DESCRIPTION_MAX).nullable().optional(),
    seo_og_image_id: z.string().nullable().optional(),
    media_gallery: z.array(z.string()).nullable().optional(),
  })
  .strict()

/** POST /admin/product-content — identifies the product explicitly in the JSON body. */
export const adminProductContentPostBodySchema = z
  .object({
    product_id: z.string().min(1),
    description_rich: z.unknown().optional(),
    seo_title: z.string().max(255).nullable().optional(),
    seo_description: z.string().max(SEO_DESCRIPTION_MAX).nullable().optional(),
    seo_og_image_id: z.string().nullable().optional(),
    media_gallery: z.array(z.string()).nullable().optional(),
  })
  .strict()

export const categoryContentBodySchema = z
  .object({
    description_rich: z.unknown().optional(),
    seo_title: z.string().max(255).nullable().optional(),
    seo_description: z.string().max(SEO_DESCRIPTION_MAX).nullable().optional(),
    seo_og_image_id: z.string().nullable().optional(),
    banner_image_id: z.string().nullable().optional(),
  })
  .strict()

export type ProductContentBody = z.infer<typeof productContentBodySchema>
export type AdminProductContentPostBody = z.infer<typeof adminProductContentPostBodySchema>
export type CategoryContentBody = z.infer<typeof categoryContentBodySchema>
