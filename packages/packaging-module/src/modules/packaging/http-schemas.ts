import { z } from "zod"

import { PACKAGING_TYPE_KINDS } from "./types"

export const adminListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).optional(),
    offset: z.coerce.number().int().min(0).optional(),
    include_deleted: z
      .union([z.literal("true"), z.literal("false")])
      .optional(),
  })
  .strict()

export const packagingTypePostBodySchema = z
  .object({
    name: z.string().min(1).max(255),
    type: z.enum(PACKAGING_TYPE_KINDS),
    length_mm: z.number().int().positive(),
    width_mm: z.number().int().positive(),
    height_mm: z.number().int().positive(),
    max_weight_g: z.number().int().positive(),
    is_active: z.boolean().optional(),
  })
  .strict()

export const packagingTypePutBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    type: z.enum(PACKAGING_TYPE_KINDS).optional(),
    length_mm: z.number().int().positive().optional(),
    width_mm: z.number().int().positive().optional(),
    height_mm: z.number().int().positive().optional(),
    max_weight_g: z.number().int().positive().optional(),
    is_active: z.boolean().optional(),
  })
  .strict()

export const suggestPackagingItemSchema = z.object({
  variant_id: z.string().min(1),
  quantity: z.number().int().positive(),
})

export const suggestPackagingBodySchema = z
  .object({
    items: z.array(suggestPackagingItemSchema).min(1),
  })
  .strict()

export const shipmentPackagingPutBodySchema = z
  .object({
    packaging_type_id: z.string().min(1),
  })
  .strict()
