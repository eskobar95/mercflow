import { z } from "zod"

export const listDiscountsQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
    q: z.string().optional(),
    status: z.enum(["draft", "active", "inactive"]).optional(),
  })
  .strict()

export const discountTypeSchema = z.enum(["product", "order", "buyget", "free_shipping"])

export const discountMethodSchema = z.enum(["code", "automatic"])

const applicationMethodSchema = z
  .object({
    type: z.enum(["fixed", "percentage"]),
    value: z.number().min(0),
    currency_code: z.string().optional(),
    target_type: z.enum(["order", "shipping_methods", "items"]).optional(),
    allocation: z.enum(["each", "across", "once"]).optional(),
    buy_rules_min_quantity: z.number().int().min(1).optional(),
    apply_to_quantity: z.number().int().min(1).optional(),
  })
  .strict()

export const createDiscountBodySchema = z
  .object({
    name: z.string().min(1).max(255),
    discount_type: discountTypeSchema,
    method: discountMethodSchema,
    code: z.string().min(1).max(255).optional(),
    status: z.enum(["draft", "active", "inactive"]).optional(),
    usage_limit: z.number().int().min(1).nullable().optional(),
    application_method: applicationMethodSchema.optional(),
    minimum_purchase_amount: z.number().min(0).optional(),
    collection_ids: z.array(z.string().min(1)).optional(),
    product_ids: z.array(z.string().min(1)).optional(),
    shipping_country_codes: z.array(z.string().length(2)).optional(),
    shipping_exclude_above: z.number().min(0).nullable().optional(),
    starts_at: z.string().datetime().optional(),
    ends_at: z.string().datetime().nullable().optional(),
  })
  .strict()
  .superRefine((body, ctx) => {
    if (body.method === "code" && (body.code === undefined || body.code.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "code is required when method is code",
        path: ["code"],
      })
    }

    if (body.method === "automatic" && body.usage_limit !== undefined && body.usage_limit !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Automatic discounts cannot have a usage limit",
        path: ["usage_limit"],
      })
    }
  })

export const updateDiscountBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    discount_type: discountTypeSchema.optional(),
    method: discountMethodSchema.optional(),
    code: z.string().min(1).max(255).optional(),
    status: z.enum(["draft", "active", "inactive"]).optional(),
    usage_limit: z.number().int().min(1).nullable().optional(),
    application_method: applicationMethodSchema.partial().optional(),
    minimum_purchase_amount: z.number().min(0).optional(),
    collection_ids: z.array(z.string().min(1)).optional(),
    product_ids: z.array(z.string().min(1)).optional(),
    shipping_country_codes: z.array(z.string().length(2)).optional(),
    shipping_exclude_above: z.number().min(0).nullable().optional(),
    starts_at: z.string().datetime().optional(),
    ends_at: z.string().datetime().nullable().optional(),
  })
  .strict()

export type CreateDiscountBody = z.infer<typeof createDiscountBodySchema>
export type UpdateDiscountBody = z.infer<typeof updateDiscountBodySchema>
