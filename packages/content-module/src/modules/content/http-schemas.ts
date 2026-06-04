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

export const articleAdminListQuerySchema = z
  .object({
    locale: z.string().min(1).max(32).optional(),
  })
  .strict()

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

/** POST /admin/category-content — upsert by category + locale (body includes category_id). */
export const categoryContentPostBodySchema = categoryContentBodySchema
  .extend({
    category_id: z.string().min(1),
  })
  .strict()

export type CategoryContentPostBody = z.infer<typeof categoryContentPostBodySchema>

const articleStatusSchema = z.enum(["draft", "published"])

const publishedAtSchema = z
  .union([z.string().datetime({ offset: true }), z.string().datetime(), z.null()])
  .optional()

export const articlePostBodySchema = z
  .object({
    title: z.string().min(1).max(512),
    slug: z.string().min(1).max(512).nullable().optional(),
    body_json: z.unknown().optional(),
    locale: z.string().min(1).max(32).optional().default("en"),
    status: articleStatusSchema.optional().default("draft"),
    published_at: publishedAtSchema,
  })
  .strict()

export const articlePatchBodySchema = z
  .object({
    title: z.string().min(1).max(512).optional(),
    slug: z.string().min(1).max(512).nullable().optional(),
    body_json: z.unknown().optional(),
    locale: z.string().min(1).max(32).optional(),
    status: articleStatusSchema.optional(),
    published_at: publishedAtSchema,
  })
  .strict()

export type ArticlePostBody = z.infer<typeof articlePostBodySchema>
export type ArticlePatchBody = z.infer<typeof articlePatchBodySchema>
