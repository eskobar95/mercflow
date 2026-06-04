import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import type { InMemoryTtlRateLimitStore } from "./in-memory-ttl-counter"

export type CreateRateLimitMiddlewareOptions = {
  store: InMemoryTtlRateLimitStore
  limit: number
  retryAfterSeconds: number
  keyResolver: (req: MedusaRequest) => string
}

export function createRateLimitMiddleware(
  options: CreateRateLimitMiddlewareOptions,
): (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) => void {
  const { store, limit, retryAfterSeconds, keyResolver } = options

  return (
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction,
  ): void => {
    const key = keyResolver(req)
    const result = store.consume(key, limit)

    if (!result.allowed) {
      res.setHeader("Retry-After", String(retryAfterSeconds))
      res.status(429).json({
        message: "Too Many Requests",
      })
      return
    }

    next()
  }
}
