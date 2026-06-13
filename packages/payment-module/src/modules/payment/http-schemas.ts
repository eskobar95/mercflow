import { z } from "zod"

import { PAYMENT_MODES, PAYMENT_PROVIDERS } from "./types"

export const upsertPaymentProviderBodySchema = z
  .object({
    provider: z.enum(PAYMENT_PROVIDERS).optional().default("stripe"),
    test_secret_key: z.string().nullable().optional(),
    test_publishable_key: z.string().nullable().optional(),
    test_webhook_secret: z.string().nullable().optional(),
    live_secret_key: z.string().nullable().optional(),
    live_publishable_key: z.string().nullable().optional(),
    live_webhook_secret: z.string().nullable().optional(),
  })
  .strict()

export type UpsertPaymentProviderBody = z.infer<typeof upsertPaymentProviderBodySchema>

export const setPaymentProviderModeBodySchema = z
  .object({
    provider: z.enum(PAYMENT_PROVIDERS).optional().default("stripe"),
    mode: z.enum(PAYMENT_MODES),
  })
  .strict()

export type SetPaymentProviderModeBody = z.infer<typeof setPaymentProviderModeBodySchema>
