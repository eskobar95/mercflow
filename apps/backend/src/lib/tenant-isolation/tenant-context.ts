import { AsyncLocalStorage } from "node:async_hooks"

/**
 * Per-request async context that carries the active tenant (store_id).
 *
 * Set once in the request middleware; read by TenantIsolationSubscriber
 * when a MikroORM transaction starts. Using AsyncLocalStorage means the
 * value propagates automatically through every await inside the same
 * async call tree without any manual threading.
 */
const storage = new AsyncLocalStorage<string>()

export const TenantContext = {
  /**
   * Wrap an async function so that all code inside it sees `storeId`
   * as the active tenant. Used in request middleware.
   */
  run<T>(storeId: string, fn: () => T): T {
    return storage.run(storeId, fn)
  },

  /**
   * Get the current tenant id, or null when called outside a tenant context
   * (e.g. cron jobs, CLI scripts, migrations).
   */
  getStoreId(): string | null {
    return storage.getStore() ?? null
  },
}
