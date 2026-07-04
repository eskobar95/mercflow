import { z } from "zod"

const DOMAIN_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

export const signupBillingSetupBodySchema = z.object({
  price_id: z.string().trim().min(1).startsWith("price_"),
  invite_token: z.string().trim(),
  email: z.string().trim().email(),
  store_name: z.string().trim().min(1).max(255),
  clerk_user_id: z.string().trim().min(1),
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value: string) => DOMAIN_PATTERN.test(value), "Invalid domain"),
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
  success_url: z.string().trim().url(),
  cancel_url: z.string().trim().url(),
})

export const platformBillingPlansQuerySchema = z.object({
  currency: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{3}$/, "Currency must be a 3-letter ISO code"),
})

export type SignupBillingSetupBody = z.infer<typeof signupBillingSetupBodySchema>

export const signupProvisionBodySchema = z
  .object({
    invite_token: z.string().trim(),
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
    stripe_payment_intent_id: z.string().trim().min(1).optional(),
    stripe_checkout_session_id: z.string().trim().min(1).optional(),
    stripe_customer_id: z.string().trim().min(1).optional(),
    stripe_subscription_id: z.string().trim().min(1).nullable().optional(),
  })
  .refine(
    (value) =>
      (value.stripe_payment_intent_id !== undefined &&
        value.stripe_payment_intent_id.length > 0) ||
      (value.stripe_checkout_session_id !== undefined &&
        value.stripe_checkout_session_id.length > 0),
    {
      message: "Either stripe_payment_intent_id or stripe_checkout_session_id is required",
      path: ["stripe_checkout_session_id"],
    },
  )

export type SignupProvisionBody = z.infer<typeof signupProvisionBodySchema>
