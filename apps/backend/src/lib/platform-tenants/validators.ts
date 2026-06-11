import { z } from "zod"

const DOMAIN_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

export const provisionTenantBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value: string) => DOMAIN_PATTERN.test(value), "Invalid domain"),
  email: z.string().trim().email(),
  currency: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{3}$/, "Currency must be a 3-letter ISO code")
    .default("dkk"),
  timezone: z.string().trim().min(1).max(64).optional(),
})

export type ProvisionTenantBody = z.infer<typeof provisionTenantBodySchema>

export const suspendTenantBodySchema = z.object({
  reason: z.string().trim().min(1).max(1000),
})

export type SuspendTenantBody = z.infer<typeof suspendTenantBodySchema>
