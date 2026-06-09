import { defineMiddlewares } from "@medusajs/framework/http"
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { mercflowPublicTenantMiddleware } from "@mercflow/seo-module/mercflow-public-tenant-middleware"
import { mercflowRedirectMiddleware } from "@mercflow/seo-module/mercflow-redirect-middleware"

import { loadRateLimitConfig } from "../lib/rate-limit/config"
import { InMemoryTtlRateLimitStore } from "../lib/rate-limit/in-memory-ttl-counter"
import { createRateLimitMiddleware } from "../lib/rate-limit/rate-limit-middleware"
import {
  resolveClientIp,
  resolvePublishableApiKey,
} from "../lib/rate-limit/request-keys"
import { sentryStoreIdMiddleware } from "../lib/sentry-store-id-middleware"
import { storeRouteVersionRedirectMiddleware } from "../lib/store-route-versioning/store-route-version-redirect"
import { tenantBootstrapMiddleware } from "../lib/tenant-isolation/tenant-bootstrap-middleware"
import { tenantIsolationMiddleware } from "../lib/tenant-isolation/tenant-middleware"

async function mercflowRedirectUnlessVersioned(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): Promise<void> {
  if (req.path?.startsWith("/v1/")) {
    next()
    return
  }

  await mercflowRedirectMiddleware(req, res, next)
}

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
      middlewares: [tenantBootstrapMiddleware, sentryStoreIdMiddleware],
    },
    {
      matcher: "/admin*",
      middlewares: [tenantIsolationMiddleware],
    },
    {
      matcher: "/store*",
      middlewares: [tenantIsolationMiddleware],
    },
    {
      matcher: "/v1/store*",
      middlewares: [tenantIsolationMiddleware],
    },
    {
      matcher: "/*",
      method: ["GET", "HEAD"],
      middlewares: [storeRouteVersionRedirectMiddleware, mercflowRedirectUnlessVersioned],
    },
    {
      matcher: "/sitemap.xml",
      method: ["GET"],
      middlewares: [mercflowPublicTenantMiddleware, publicRateLimitMiddleware],
    },
    {
      matcher: "/robots.txt",
      method: ["GET"],
      middlewares: [mercflowPublicTenantMiddleware, publicRateLimitMiddleware],
    },
    {
      matcher: "/feed*",
      method: ["GET"],
      middlewares: [mercflowPublicTenantMiddleware, publicRateLimitMiddleware],
    },
    {
      matcher: "/v1/sitemap.xml",
      method: ["GET"],
      middlewares: [mercflowPublicTenantMiddleware, publicRateLimitMiddleware],
    },
    {
      matcher: "/v1/robots.txt",
      method: ["GET"],
      middlewares: [mercflowPublicTenantMiddleware, publicRateLimitMiddleware],
    },
    {
      matcher: "/v1/feed*",
      method: ["GET"],
      middlewares: [mercflowPublicTenantMiddleware, publicRateLimitMiddleware],
    },
    {
      matcher: "/store*",
      method: ["GET"],
      middlewares: [storeRateLimitMiddleware],
    },
    {
      matcher: "/v1/store*",
      method: ["GET"],
      middlewares: [storeRateLimitMiddleware],
    },
  ],
})
