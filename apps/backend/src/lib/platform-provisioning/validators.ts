import { z } from "zod"

const DOMAIN_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

export const signupBillingSetupBodySchema = z.object({
  price_id: z.string().trim().min(1),
  invite_token: z.string().trim().min(1),
  email: z.string().trim().email(),
  store_name: z.string().trim().min(1).max(255),
})

export const platformBillingPlansQuerySchema = z.object({
  currency: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{3}$/, "Currency must be a 3-letter ISO code"),
})

export type SignupBillingSetupBody = z.infer<typeof signupBillingSetupBodySchema>

export const signupProvisionBodySchema = z.object({
  invite_token: z.string().trim().min(1),
  clerk_user_id: z.string().trim().min(1),
  store_name: z.string().trim().min(1).max(255),
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
    .regex(/^[a-z]{3}$/, "Currency must be a 3-letter ISO code"),
  country: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{2}$/, "Country must be a 2-letter ISO code"),
  timezone: z.string().trim().min(1).max(64),
  stripe_payment_intent_id: z.string().trim().min(1),
  stripe_customer_id: z.string().trim().min(1).optional(),
  stripe_subscription_id: z.string().trim().min(1).nullable().optional(),
})

export type SignupProvisionBody = z.infer<typeof signupProvisionBodySchema>
