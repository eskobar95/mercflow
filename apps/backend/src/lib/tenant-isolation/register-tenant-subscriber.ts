import type { EntityManager } from "@medusajs/framework/mikro-orm/core"

import { TenantIsolationSubscriber } from "./tenant-subscriber"

const subscriber = new TenantIsolationSubscriber()
let registered = false

/**
 * Register the TenantIsolationSubscriber on a MikroORM EntityManager.
 *
 * Medusa exposes each module's EM as `"manager"` in the module's own IoC
 * container. The forked EM returned by `orm.em.fork()` shares the parent
 * ORM's EventManager, so registering once on any fork is sufficient for
 * the entire ORM instance.
 *
 * Call this once per module EM during application bootstrap — typically
 * from an `onApplicationBootstrap` hook or a startup script.
 *
 * Safe to call multiple times: the subscriber is registered at most once
 * globally due to the `registered` guard.
 *
 * @example
 * ```ts
 * const productService = container.resolve(Modules.PRODUCT)
 * // __container__ is an Awilix cradle proxy: property access resolves keys
 * const em = (productService as unknown as { __container__: Record<string, unknown> })
 *   .__container__["manager"] as EntityManager
 * registerTenantSubscriber(em)
 * ```
 */
export function registerTenantSubscriber(em: EntityManager): void {
  if (registered) return
  em.getEventManager().registerSubscriber(subscriber)
  registered = true
}
