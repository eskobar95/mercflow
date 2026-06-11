import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  extractClerkEmailFromPayload,
  isAllowedOperatorEmail,
} from "../src/lib/platform-auth/extract-clerk-email"

vi.mock("@clerk/backend", () => ({
  verifyToken: vi.fn(),
}))

import { verifyToken } from "@clerk/backend"

import { clerkPlatformAuthMiddleware } from "../src/lib/platform-auth/clerk-platform-auth-middleware"

describe("platform auth helpers", () => {
  it("extracts email from Clerk payload", () => {
    expect(
      extractClerkEmailFromPayload({ email: "Ops@Mercflow.Shop" }),
    ).toBe("ops@mercflow.shop")
  })

  it("rejects non-mercflow.shop emails", () => {
    expect(isAllowedOperatorEmail("user@gmail.com", "mercflow.shop")).toBe(false)
    expect(isAllowedOperatorEmail("ops@mercflow.shop", "mercflow.shop")).toBe(
      true,
    )
  })
})

describe("clerkPlatformAuthMiddleware", () => {
  const originalSecret = process.env.PLATFORM_CLERK_SECRET_KEY

  beforeEach(() => {
    process.env.PLATFORM_CLERK_SECRET_KEY = "test_secret"
    vi.mocked(verifyToken).mockReset()
  })

  afterEach(() => {
    process.env.PLATFORM_CLERK_SECRET_KEY = originalSecret
  })

  it("returns 401 without bearer token", async () => {
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const req = { headers: {} }
    const next = vi.fn()

    await clerkPlatformAuthMiddleware(
      req as never,
      { status } as never,
      next as never,
    )

    expect(status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it("returns 403 for disallowed email domain", async () => {
    vi.mocked(verifyToken).mockResolvedValue({
      sub: "user_123",
      email: "outsider@gmail.com",
    } as never)

    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const req = { headers: { authorization: "Bearer token" } }
    const next = vi.fn()

    await clerkPlatformAuthMiddleware(
      req as never,
      { status } as never,
      next as never,
    )

    expect(status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it("attaches operator and calls next for allowed email", async () => {
    vi.mocked(verifyToken).mockResolvedValue({
      sub: "user_123",
      email: "ops@mercflow.shop",
    } as never)

    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const req = { headers: { authorization: "Bearer token" } }
    const next = vi.fn()

    await clerkPlatformAuthMiddleware(
      req as never,
      { status } as never,
      next as never,
    )

    expect(next).toHaveBeenCalled()
    expect(req).toMatchObject({
      platformOperator: {
        userId: "user_123",
        email: "ops@mercflow.shop",
      },
    })
  })
})
