import { createRateLimitMiddleware } from "../rate-limit/rate-limit-middleware"
import { InMemoryTtlRateLimitStore } from "../rate-limit/in-memory-ttl-counter"
import { resolveClientIp } from "../rate-limit/request-keys"

export type PlatformRateLimitConfig = {
  limit: number
  windowMs: number
  retryAfterSeconds: number
}

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000
const ONE_MINUTE_MS = 60 * 1000

/** POST /platform/invites — prevent invite spam. */
export const PLATFORM_INVITES_RATE_LIMIT: PlatformRateLimitConfig = {
  limit: 10,
  windowMs: FIFTEEN_MINUTES_MS,
  retryAfterSeconds: 15 * 60,
}

/** POST /platform/signup/* — prevent signup abuse. */
export const PLATFORM_SIGNUP_RATE_LIMIT: PlatformRateLimitConfig = {
  limit: 20,
  windowMs: FIFTEEN_MINUTES_MS,
  retryAfterSeconds: 15 * 60,
}

/** GET /platform/billing/plans — belt-and-suspenders on public catalog reads. */
export const PLATFORM_BILLING_PLANS_RATE_LIMIT: PlatformRateLimitConfig = {
  limit: 30,
  windowMs: ONE_MINUTE_MS,
  retryAfterSeconds: 60,
}

/** POST /platform/provision — prevent provision flooding. */
export const PLATFORM_PROVISION_RATE_LIMIT: PlatformRateLimitConfig = {
  limit: 5,
  windowMs: FIFTEEN_MINUTES_MS,
  retryAfterSeconds: 15 * 60,
}

function createPlatformRateLimitMiddleware(
  config: PlatformRateLimitConfig,
): ReturnType<typeof createRateLimitMiddleware> {
  const store = new InMemoryTtlRateLimitStore(config.windowMs)

  return createRateLimitMiddleware({
    store,
    limit: config.limit,
    retryAfterSeconds: config.retryAfterSeconds,
    keyResolver: resolveClientIp,
  })
}

export const platformInvitesRateLimitMiddleware = createPlatformRateLimitMiddleware(
  PLATFORM_INVITES_RATE_LIMIT,
)

export const platformSignupRateLimitMiddleware = createPlatformRateLimitMiddleware(
  PLATFORM_SIGNUP_RATE_LIMIT,
)

export const platformBillingPlansRateLimitMiddleware =
  createPlatformRateLimitMiddleware(PLATFORM_BILLING_PLANS_RATE_LIMIT)

export const platformProvisionRateLimitMiddleware = createPlatformRateLimitMiddleware(
  PLATFORM_PROVISION_RATE_LIMIT,
)
