import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { describe, expect, it } from "vitest"

import { loadRateLimitConfig } from "../src/lib/rate-limit/config"
import { InMemoryTtlRateLimitStore } from "../src/lib/rate-limit/in-memory-ttl-counter"
import { createRateLimitMiddleware } from "../src/lib/rate-limit/rate-limit-middleware"
import {
  resolveClientIp,
  resolvePublishableApiKey,
} from "../src/lib/rate-limit/request-keys"

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

describe("loadRateLimitConfig", () => {
  it("uses defaults when env vars are unset", (): void => {
    expect(loadRateLimitConfig({})).toEqual({
      publicRpm: 60,
      storeRpm: 300,
      retryAfterSeconds: 60,
      windowMs: 60_000,
    })
  })

  it("reads RPM limits from env vars", (): void => {
    expect(
      loadRateLimitConfig({
        RATE_LIMIT_PUBLIC_RPM: "120",
        RATE_LIMIT_STORE_RPM: "600",
      }),
    ).toEqual({
      publicRpm: 120,
      storeRpm: 600,
      retryAfterSeconds: 60,
      windowMs: 60_000,
    })
  })
})

describe("request key resolvers", () => {
  it("resolves client IP from x-forwarded-for", (): void => {
    const req = {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as MedusaRequest

    expect(resolveClientIp(req)).toBe("203.0.113.1")
  })

  it("resolves publishable api key from header", (): void => {
    const req = {
      headers: { "x-publishable-api-key": "pk_test_123" },
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as MedusaRequest

    expect(resolvePublishableApiKey(req)).toBe("pk_test_123")
  })
})

describe("public route rate limiting", () => {
  it("returns 429 with Retry-After on the 61st /sitemap.xml request per IP", (): void => {
    const store = new InMemoryTtlRateLimitStore(60_000)
    const middleware = createRateLimitMiddleware({
      store,
      limit: 60,
      retryAfterSeconds: 60,
      keyResolver: resolveClientIp,
    })

    for (let i = 0; i < 60; i += 1) {
      const allowed = invokeMiddleware(middleware, {
        headers: {},
        ip: "198.51.100.10",
      })

      expect(allowed.nextCalled).toBe(true)
      expect(allowed.statusCode).toBeUndefined()
    }

    const blocked = invokeMiddleware(middleware, {
      headers: {},
      ip: "198.51.100.10",
    })

    expect(blocked.nextCalled).toBe(false)
    expect(blocked.statusCode).toBe(429)
    expect(blocked.headers["Retry-After"]).toBe("60")
    expect(blocked.body).toEqual({ message: "Too Many Requests" })
  })
})

describe("store route rate limiting", () => {
  it("keys limits by publishable api key", (): void => {
    const store = new InMemoryTtlRateLimitStore(60_000)
    const middleware = createRateLimitMiddleware({
      store,
      limit: 2,
      retryAfterSeconds: 60,
      keyResolver: resolvePublishableApiKey,
    })

    const firstKeyRequest = (): MiddlewareInvocationResult =>
      invokeMiddleware(middleware, {
        headers: { "x-publishable-api-key": "pk_a" },
        ip: "127.0.0.1",
      })

    expect(firstKeyRequest().nextCalled).toBe(true)
    expect(firstKeyRequest().nextCalled).toBe(true)

    const blockedForFirstKey = firstKeyRequest()
    expect(blockedForFirstKey.statusCode).toBe(429)

    const otherKeyAllowed = invokeMiddleware(middleware, {
      headers: { "x-publishable-api-key": "pk_b" },
      ip: "127.0.0.1",
    })

    expect(otherKeyAllowed.nextCalled).toBe(true)
  })
})
