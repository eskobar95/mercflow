import { z } from "zod"

export const seoLocaleQuerySchema = z.object({
  locale: z.string().min(1).max(32).optional().default("en"),
})
