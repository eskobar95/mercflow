import { z } from "zod"

import { PURCHASE_ORDER_STATUSES } from "./types"

export const orderNotePostBodySchema = z.object({
  content: z.string().min(1).max(4000),
  created_by: z.string().min(1).max(255).optional(),
})

export const pickListQuerySchema = z.object({
  date: z.enum(["today"]).default("today"),
  store_id: z.string().optional(),
})

export const supplierPostBodySchema = z
  .object({
    name: z.string().min(1).max(255),
    contact_person: z.string().max(255).nullable().optional(),
    email: z.union([z.string().email().max(255), z.literal("")]).nullable().optional(),
    country: z.string().max(64).nullable().optional(),
    currency: z.string().max(8).nullable().optional(),
  })
  .strict()

export const supplierPatchBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    contact_person: z.string().max(255).nullable().optional(),
    email: z.union([z.string().email().max(255), z.literal("")]).nullable().optional(),
    country: z.string().max(64).nullable().optional(),
    currency: z.string().max(8).nullable().optional(),
  })
  .strict()

export const purchaseOrderLineInputSchema = z.object({
  variant_id: z.string().min(1),
  ordered_qty: z.number().int().positive(),
  unit_cost: z.number().nonnegative(),
})

export const purchaseOrderPostBodySchema = z
  .object({
    supplier_id: z.string().min(1),
    expected_date: z.string().min(1).nullable().optional(),
    reference: z.string().max(255).nullable().optional(),
    notes: z.string().max(4000).nullable().optional(),
    lines: z.array(purchaseOrderLineInputSchema).min(1),
  })
  .strict()

export const purchaseOrderStatusPatchBodySchema = z
  .object({
    status: z.enum(PURCHASE_ORDER_STATUSES),
  })
  .strict()
