import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { resolveRequestStoreId } from "../api/http/resolve-request-store-id"
import { SEO_MODULE } from "../modules/seo"
import type SeoModuleService from "../modules/seo/service"
import { normalizeRedirectPath } from "../modules/seo/utils/paths"

const SKIP_PREFIXES = ["/admin", "/store", "/auth", "/health", "/sitemap.xml", "/robots.txt", "/feed"]

function shouldSkipRedirectLookup(pathname: string): boolean {
  return SKIP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

/**
 * Intercepts GET requests and returns 301 when a mercflow_redirect row matches the path.
 * Registered early in `apps/backend/src/api/middlewares.ts` (before Medusa route resolution).
 */
export async function mercflowRedirectMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): Promise<void> {
  if (req.method !== "GET" && req.method !== "HEAD") {
    next()
    return
  }

  const pathname = normalizeRedirectPath(req.path ?? "/")
  if (shouldSkipRedirectLookup(pathname)) {
    next()
    return
  }

  const storeId = resolveRequestStoreId(req)
  if (!storeId) {
    next()
    return
  }

  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const match = await seoService.findRedirectByFromPath(storeId, pathname)
  if (!match) {
    next()
    return
  }

  res.redirect(301, match.to_path)
}
