import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { resolveSentryStoreId } from "../resolve-sentry-store-id"
import { TenantContext } from "./tenant-context"

/**
 * Medusa request middleware that activates the tenant context for the
 * duration of the incoming HTTP request.
 *
 * All MikroORM transactions started within this request (by any Medusa
 * module service) will automatically receive `SET LOCAL app.tenant_id`
 * via TenantIsolationSubscriber, scoping every SELECT/INSERT/UPDATE/DELETE
 * to the resolved store.
 *
 * Mount this middleware BEFORE any route handlers that need tenant isolation.
 * Routes that should run without a tenant scope (e.g. platform-admin routes)
 * must not have this middleware applied.
 *
 * When no store_id can be resolved the request continues without setting
 * a tenant context, which means RLS policies will see an empty
 * `app.tenant_id` and return no rows — the caller will get an empty result
 * set rather than cross-tenant data.
 */
export async function tenantIsolationMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
): Promise<void> {
  const storeId = await resolveSentryStoreId(req)

  if (!storeId) {
    next()
    return
  }

  TenantContext.run(storeId, () => next())
}
