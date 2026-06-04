import { z } from "zod"

export const slugStrategySchema = z.enum(["nordic", "omit"])

export const jsonLdSettingsSchema = z
  .object({
    product: z.boolean().optional(),
    category: z.boolean().optional(),
    global: z.boolean().optional(),
  })
  .strict()

export const seoConfigBodySchema = z
  .object({
    storefront_url: z.string().url().nullable().optional(),
    slug_strategy: slugStrategySchema.optional(),
    org_name: z.string().max(255).nullable().optional(),
    org_logo_url: z.string().url().nullable().optional(),
    org_social_urls: z.record(z.string().min(1).max(64), z.string().url()).nullable().optional(),
    json_ld_settings: jsonLdSettingsSchema.optional(),
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

const sitemapPageTypeSettingSchema = z.object({
  priority: z.number().min(0).max(1),
  changefreq: z.string().min(1).max(32),
})

export const sitemapConfigBodySchema = z
  .object({
    page_type_settings: z
      .object({
        product: sitemapPageTypeSettingSchema.optional(),
        category: sitemapPageTypeSettingSchema.optional(),
        page: sitemapPageTypeSettingSchema.optional(),
      })
      .strict()
      .optional(),
    excluded_product_ids: z.array(z.string().min(1)).optional(),
    excluded_category_ids: z.array(z.string().min(1)).optional(),
    excluded_page_ids: z.array(z.string().min(1)).optional(),
  })
  .strict()

const robotsRuleSchema = z.object({
  user_agent: z.string().min(1).max(256),
  allow: z.array(z.string().min(1).max(2048)),
  disallow: z.array(z.string().min(1).max(2048)),
})

export const robotsConfigBodySchema = z
  .object({
    structured_rules: z
      .object({
        rules: z.array(robotsRuleSchema).max(50),
      })
      .strict()
      .optional(),
    freetext_override: z.string().max(65535).nullable().optional(),
    change_summary: z.string().max(500).optional(),
  })
  .strict()
