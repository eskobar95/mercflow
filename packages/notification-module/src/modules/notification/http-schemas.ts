import { z } from "zod"

export const adminListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict()

export const updateEmailConfigBrandingBodySchema = z
  .object({
    logo_url: z.string().url().nullable().optional(),
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

export const resendEmailParamsSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict()

export const resendEmailBodySchema = z.object({}).strict()
