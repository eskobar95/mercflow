import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  buildV1RedirectTarget,
  shouldRedirectToV1,
} from "./mercflow-owned-store-paths"

export function storeRouteVersionRedirectMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): void {
  if (req.method !== "GET" && req.method !== "HEAD") {
    next()
    return
  }

  const pathname = req.path ?? "/"
  if (!shouldRedirectToV1(pathname)) {
    next()
    return
  }

  const search = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""
  res.redirect(301, buildV1RedirectTarget(pathname, search))
}
