import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { onApplicationBootstrap } from "../../subscribers/tenant-bootstrap"

let bootstrapPromise: Promise<void> | null = null

/**
 * Invokes tenant bootstrap once per process on the first HTTP request, before
 * any route handler or tenant-scoped middleware runs.
 */
export async function tenantBootstrapMiddleware(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction,
): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = onApplicationBootstrap(req.scope)
  }

  await bootstrapPromise
  next()
}
