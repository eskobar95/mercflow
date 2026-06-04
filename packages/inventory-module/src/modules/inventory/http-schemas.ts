import { z } from "zod"

export const orderNotePostBodySchema = z.object({
  content: z.string().min(1).max(4000),
  created_by: z.string().min(1).max(255).optional(),
})

export const pickListQuerySchema = z.object({
  date: z.enum(["today"]).default("today"),
  store_id: z.string().optional(),
})
