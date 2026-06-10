import type { MedusaContainer } from "@medusajs/framework"
import type { EntityManager } from "@medusajs/framework/mikro-orm/core"

import { registerTenantSubscriber } from "./register-tenant-subscriber"

type ModuleServiceWithContainer = {
  __container__?: Record<string, unknown>
}

export function resolveModuleEntityManager(
  service: ModuleServiceWithContainer | undefined | null
): EntityManager | null {
  const em = service?.__container__?.["manager"]
  if (!em) {
    return null
  }
  return em as EntityManager
}

/**
 * Register TenantIsolationSubscriber on each resolved module that exposes a
 * MikroORM EntityManager. Safe to call multiple times per container bootstrap.
 */
export function registerTenantSubscribersOnContainer(
  container: MedusaContainer,
  moduleKeys: string[]
): void {
  const registeredManagers = new Set<EntityManager>()

  for (const moduleKey of moduleKeys) {
    let service: ModuleServiceWithContainer
    try {
      service = container.resolve(moduleKey) as ModuleServiceWithContainer
    } catch {
      continue
    }

    if (!service) {
      continue
    }

    const em = resolveModuleEntityManager(service)
    if (!em || registeredManagers.has(em)) {
      continue
    }

    registerTenantSubscriber(em)
    registeredManagers.add(em)
  }
}
