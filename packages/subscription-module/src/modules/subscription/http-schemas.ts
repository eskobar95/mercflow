import { z } from "zod"

import { SUBSCRIPTION_STATUSES } from "./types"

export const listSubscriptionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  customer_id: z.string().min(1).optional(),
  status: z.enum(SUBSCRIPTION_STATUSES).optional(),
  store_id: z.string().min(1).optional(),
})

export type ListSubscriptionsQuery = z.infer<typeof listSubscriptionsQuerySchema>

export const pauseSubscriptionBodySchema = z.object({
  pause_until: z.string().datetime({ offset: true }).nullable().optional(),
})

export type PauseSubscriptionBody = z.infer<typeof pauseSubscriptionBodySchema>

export const updateRenewalTimestampBodySchema = z.object({
  next_renewal_at: z.string().datetime({ offset: true }),
  current_period_start: z.string().datetime({ offset: true }).optional(),
  current_period_end: z.string().datetime({ offset: true }).optional(),
})

export type UpdateRenewalTimestampBody = z.infer<
  typeof updateRenewalTimestampBodySchema
>

export const upsertClubMemberPriceBodySchema = z.object({
  variant_id: z.string().min(1),
  amount: z.number().finite().nonnegative(),
  currency_code: z.string().min(1),
})

export type UpsertClubMemberPriceBody = z.infer<typeof upsertClubMemberPriceBodySchema>
