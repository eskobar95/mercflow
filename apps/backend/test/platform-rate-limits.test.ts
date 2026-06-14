import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { describe, expect, it } from "vitest"

import {
  PLATFORM_BILLING_PLANS_RATE_LIMIT,
  PLATFORM_INVITES_RATE_LIMIT,
  PLATFORM_PROVISION_RATE_LIMIT,
  PLATFORM_SIGNUP_RATE_LIMIT,
  platformInvitesRateLimitMiddleware,
} from "../src/lib/platform-http/rateLimits"

type MiddlewareHandler = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) => void

type MiddlewareInvocationResult = {
  statusCode?: number
  body?: unknown
  headers: Record<string, string | number | string[] | undefined>
  nextCalled: boolean
}

function invokeMiddleware(
  middleware: MiddlewareHandler,
  reqOverrides: Partial<MedusaRequest> = {},
): MiddlewareInvocationResult {
  const headers: Record<string, string | string[] | undefined> = {}
  const result: MiddlewareInvocationResult = {
    headers,
    nextCalled: false,
  }

  const req = {
    headers,
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" },
    ...reqOverrides,
  } as unknown as MedusaRequest

  const res = {
    statusCode: 200,
    setHeader(name: string, value: string): void {
      headers[name] = value
    },
    status(code: number) {
      result.statusCode = code
      return {
        json(body: unknown): void {
          result.body = body
        },
      }
    },
  } as unknown as MedusaResponse

  const next: MedusaNextFunction = (): void => {
    result.nextCalled = true
  }

  middleware(req, res, next)
  return result
}

describe("platform rate limit configs", () => {
  it("defines invite limits as 10 per 15 minutes", (): void => {
    expect(PLATFORM_INVITES_RATE_LIMIT).toEqual({
      limit: 10,
      windowMs: 900_000,
      retryAfterSeconds: 900,
    })
  })

  it("defines signup limits as 20 per 15 minutes", (): void => {
    expect(PLATFORM_SIGNUP_RATE_LIMIT.limit).toBe(20)
    expect(PLATFORM_SIGNUP_RATE_LIMIT.windowMs).toBe(900_000)
  })

  it("defines billing plans limits as 30 per minute", (): void => {
    expect(PLATFORM_BILLING_PLANS_RATE_LIMIT).toEqual({
      limit: 30,
      windowMs: 60_000,
      retryAfterSeconds: 60,
    })
  })

  it("defines provision limits as 5 per 15 minutes", (): void => {
    expect(PLATFORM_PROVISION_RATE_LIMIT.limit).toBe(5)
    expect(PLATFORM_PROVISION_RATE_LIMIT.windowMs).toBe(900_000)
  })
})

describe("platformInvitesRateLimitMiddleware", () => {
  it("returns 429 on the 11th POST /platform/invites request per IP", (): void => {
    for (let i = 0; i < PLATFORM_INVITES_RATE_LIMIT.limit; i += 1) {
      const allowed = invokeMiddleware(platformInvitesRateLimitMiddleware, {
        ip: "203.0.113.55",
      })

      expect(allowed.nextCalled).toBe(true)
      expect(allowed.statusCode).toBeUndefined()
    }

    const blocked = invokeMiddleware(platformInvitesRateLimitMiddleware, {
      ip: "203.0.113.55",
    })

    expect(blocked.nextCalled).toBe(false)
    expect(blocked.statusCode).toBe(429)
    expect(blocked.headers["Retry-After"]).toBe(
      String(PLATFORM_INVITES_RATE_LIMIT.retryAfterSeconds),
    )
    expect(blocked.body).toEqual({ message: "Too Many Requests" })
  })
})
