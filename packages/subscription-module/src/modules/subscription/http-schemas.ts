import { z } from "zod"

export const listSubscriptionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  customer_id: z.string().min(1).optional(),
})

export type ListSubscriptionsQuery = z.infer<typeof listSubscriptionsQuerySchema>
