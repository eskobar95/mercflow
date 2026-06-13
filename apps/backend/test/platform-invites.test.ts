import { describe, expect, it } from "vitest"

import {
  createPlatformInviteBodySchema,
  validatePlatformInviteQuerySchema,
} from "../src/lib/platform-invites/validators"
import {
  generateInviteToken,
  getInviteExpiresAt,
  hashInviteToken,
  INVITE_TTL_HOURS,
} from "../src/lib/platform-invites/token"
import { resolveEffectiveInviteStatus } from "../src/lib/platform-db/platform-invites"
import { buildPlatformInviteUrl } from "../src/lib/platform-invites/send-invite-email"

describe("platform invite token helpers", () => {
  it("hashes tokens deterministically", () => {
    const raw = "11111111-1111-1111-1111-111111111111"
    expect(hashInviteToken(raw)).toBe(hashInviteToken(raw))
    expect(hashInviteToken(raw)).not.toBe(raw)
  })

  it("generates UUID tokens", () => {
    const token = generateInviteToken()
    expect(token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
  })

  it("expires invites after 72 hours", () => {
    const createdAt = new Date("2026-06-13T12:00:00.000Z")
    const expiresAt = getInviteExpiresAt(createdAt)
    expect(expiresAt.toISOString()).toBe("2026-06-16T12:00:00.000Z")
    expect(INVITE_TTL_HOURS).toBe(72)
  })
})

describe("platform invite status resolution", () => {
  it("marks pending invites as expired after expires_at", () => {
    const status = resolveEffectiveInviteStatus(
      "pending",
      new Date("2026-06-13T12:00:00.000Z"),
      new Date("2026-06-14T12:00:00.000Z"),
    )

    expect(status).toBe("expired")
  })

  it("keeps redeemed invites unchanged", () => {
    const status = resolveEffectiveInviteStatus(
      "redeemed",
      new Date("2026-06-13T12:00:00.000Z"),
      new Date("2026-06-14T12:00:00.000Z"),
    )

    expect(status).toBe("redeemed")
  })
})

describe("platform invite validators", () => {
  it("accepts valid create payload", () => {
    const parsed = createPlatformInviteBodySchema.parse({
      email: "merchant@example.com",
    })

    expect(parsed.email).toBe("merchant@example.com")
  })

  it("rejects invalid email", () => {
    const result = createPlatformInviteBodySchema.safeParse({
      email: "not-an-email",
    })

    expect(result.success).toBe(false)
  })

  it("requires validate token query", () => {
    const result = validatePlatformInviteQuerySchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe("platform invite URL builder", () => {
  it("builds signup URL with encoded token", () => {
    const originalBase = process.env.MERCFLOW_SIGNUP_BASE_URL
    process.env.MERCFLOW_SIGNUP_BASE_URL = "https://admin.mercflow.shop/signup"

    try {
      expect(buildPlatformInviteUrl("token with spaces")).toBe(
        "https://admin.mercflow.shop/signup?invite=token%20with%20spaces",
      )
    } finally {
      if (originalBase === undefined) {
        delete process.env.MERCFLOW_SIGNUP_BASE_URL
      } else {
        process.env.MERCFLOW_SIGNUP_BASE_URL = originalBase
      }
    }
  })
})
