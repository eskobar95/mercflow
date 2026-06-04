import { defineMiddlewares } from "@medusajs/framework/http"
import { mercflowFeedTenantMiddleware } from "@mercflow/feed-module/mercflow-feed-tenant-middleware"
import { mercflowRedirectMiddleware } from "@mercflow/seo-module/mercflow-redirect-middleware"

import { loadRateLimitConfig } from "../lib/rate-limit/config"
import { InMemoryTtlRateLimitStore } from "../lib/rate-limit/in-memory-ttl-counter"
import { createRateLimitMiddleware } from "../lib/rate-limit/rate-limit-middleware"
import {
  resolveClientIp,
  resolvePublishableApiKey,
} from "../lib/rate-limit/request-keys"

const config = loadRateLimitConfig()
const publicRateLimitStore = new InMemoryTtlRateLimitStore(config.windowMs)
const storeRateLimitStore = new InMemoryTtlRateLimitStore(config.windowMs)

const publicRateLimitMiddleware = createRateLimitMiddleware({
  store: publicRateLimitStore,
  limit: config.publicRpm,
  retryAfterSeconds: config.retryAfterSeconds,
  keyResolver: resolveClientIp,
})

const storeRateLimitMiddleware = createRateLimitMiddleware({
  store: storeRateLimitStore,
  limit: config.storeRpm,
  retryAfterSeconds: config.retryAfterSeconds,
  keyResolver: resolvePublishableApiKey,
})

export default defineMiddlewares({
  routes: [
    {
      matcher: "/*",
      method: ["GET", "HEAD"],
      middlewares: [mercflowRedirectMiddleware],
    },
    {
      matcher: "/sitemap.xml",
      method: ["GET"],
      middlewares: [publicRateLimitMiddleware],
    },
    {
      matcher: "/robots.txt",
      method: ["GET"],
      middlewares: [publicRateLimitMiddleware],
    },
    {
      matcher: "/feed*",
      method: ["GET"],
      middlewares: [mercflowFeedTenantMiddleware, publicRateLimitMiddleware],
    },
    {
      matcher: "/store*",
      method: ["GET"],
      middlewares: [storeRateLimitMiddleware],
    },
  ],
})
