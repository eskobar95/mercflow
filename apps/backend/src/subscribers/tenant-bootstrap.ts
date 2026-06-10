import type { MedusaContainer } from "@medusajs/framework"
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

import { registerTenantSubscribersOnContainer } from "../lib/tenant-isolation/register-tenant-subscribers-on-container"

/** Medusa lifecycle event emitted by @medusajs/tenancy-core at application start. */
export const APPLICATION_BOOTSTRAP_EVENT = "application.bootstrap"

let bootstrapComplete = false

/**
 * Register TenantIsolationSubscriber on every loaded Medusa module that exposes
 * a MikroORM EntityManager. Safe to call multiple times — registerTenantSubscriber
 * is idempotent per EntityManager.
 */
export async function onApplicationBootstrap(container: MedusaContainer): Promise<void> {
  if (bootstrapComplete) {
    return
  }

  const moduleKeys = Object.values(Modules) as string[]
  registerTenantSubscribersOnContainer(container, moduleKeys)
  bootstrapComplete = true
}

async function tenantBootstrapSubscriber({ container }: SubscriberArgs): Promise<void> {
  await onApplicationBootstrap(container)
}

export default tenantBootstrapSubscriber

export const config: SubscriberConfig = {
  event: APPLICATION_BOOTSTRAP_EVENT,
}
