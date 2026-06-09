import type { MedusaContainer } from "@medusajs/framework"
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type { EntityManager } from "@medusajs/framework/mikro-orm/core"

import { registerTenantSubscriber } from "../lib/tenant-isolation/register-tenant-subscriber"

/** Medusa lifecycle event emitted by @medusajs/tenancy-core at application start. */
export const APPLICATION_BOOTSTRAP_EVENT = "application.bootstrap"

type ModuleServiceWithContainer = {
  __container__?: Record<string, unknown>
}

let bootstrapComplete = false

function resolveModuleEntityManager(service: ModuleServiceWithContainer): EntityManager | null {
  const em = service.__container__?.["manager"]
  if (!em) {
    return null
  }
  return em as EntityManager
}

/**
 * Register TenantIsolationSubscriber on every loaded Medusa module that exposes
 * a MikroORM EntityManager. Safe to call multiple times — registerTenantSubscriber
 * is idempotent and only attaches once per process.
 */
export async function onApplicationBootstrap(container: MedusaContainer): Promise<void> {
  if (bootstrapComplete) {
    return
  }

  const moduleKeys = Object.values(Modules) as string[]
  const registeredManagers = new Set<EntityManager>()

  for (const moduleKey of moduleKeys) {
    let service: ModuleServiceWithContainer
    try {
      service = container.resolve(moduleKey) as ModuleServiceWithContainer
    } catch {
      continue
    }

    const em = resolveModuleEntityManager(service)
    if (!em || registeredManagers.has(em)) {
      continue
    }

    registerTenantSubscriber(em)
    registeredManagers.add(em)
  }

  bootstrapComplete = true
}

async function tenantBootstrapSubscriber({ container }: SubscriberArgs): Promise<void> {
  await onApplicationBootstrap(container)
}

export default tenantBootstrapSubscriber

export const config: SubscriberConfig = {
  event: APPLICATION_BOOTSTRAP_EVENT,
}
