import { z } from "zod"

export const adminListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict()

const httpsLogoUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith("https://"), {
    message: "logo_url must use HTTPS",
  })

export const updateEmailConfigBrandingBodySchema = z
  .object({
    logo_url: httpsLogoUrlSchema.nullable().optional(),
    brand_color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .nullable()
      .optional(),
    from_name: z.string().min(1).max(255).nullable().optional(),
    reply_to: z.string().email().nullable().optional(),
    support_email: z.string().email().nullable().optional(),
  })
  .strict()

export const emailPreviewQuerySchema = z
  .object({
    store_id: z.string().min(1).optional(),
    logo_url: httpsLogoUrlSchema.nullable().optional(),
    brand_color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .nullable()
      .optional(),
    from_name: z.string().min(1).max(255).nullable().optional(),
    reply_to: z.string().email().nullable().optional(),
    support_email: z.string().email().nullable().optional(),
  })
  .strict()

export const setupDomainBodySchema = z
  .object({
    domain: z
      .string()
      .trim()
      .min(3)
      .max(253)
      .regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i),
  })
  .strict()

export const resendEmailParamsSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict()

export const resendEmailBodySchema = z.object({}).strict()
