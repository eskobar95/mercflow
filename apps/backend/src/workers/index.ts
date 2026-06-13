import type { MedusaContainer } from "@medusajs/framework"
import { registerNotificationTemplates } from "@mercflow/notification-module/templates"
import {
  startProvisionTenantWorker,
  startSubscriptionRenewalWorker,
  stopProvisionTenantWorker,
  stopSubscriptionRenewalWorker,
  type ProvisionTenantWorkerHandle,
  type SubscriptionRenewalWorkerHandle,
} from "@mercflow/worker"

import {
  startNotificationWorker,
  stopNotificationWorker,
  templateRegistry,
  type NotificationWorkerHandle,
} from "./notification-worker"

let templatesRegistered = false

function ensureNotificationTemplatesRegistered(): void {
  if (templatesRegistered) {
    return
  }

  registerNotificationTemplates(templateRegistry)
  templatesRegistered = true
}

let activeNotificationHandle: NotificationWorkerHandle | null = null
let activeSubscriptionRenewalHandle: SubscriptionRenewalWorkerHandle | null = null
let activeProvisionTenantHandle: ProvisionTenantWorkerHandle | null = null
let shutdownHooksRegistered = false

function registerShutdownHooks(): void {
  if (shutdownHooksRegistered) {
    return
  }

  const shutdown = (): void => {
    void stopWorkers()
  }

  process.once("SIGTERM", shutdown)
  process.once("SIGINT", shutdown)
  shutdownHooksRegistered = true
}

export async function startWorkers(container: MedusaContainer): Promise<void> {
  if (
    activeNotificationHandle !== null &&
    activeSubscriptionRenewalHandle !== null &&
    activeProvisionTenantHandle !== null
  ) {
    return
  }

  ensureNotificationTemplatesRegistered()

  if (activeNotificationHandle === null) {
    activeNotificationHandle = await startNotificationWorker(container)
  }

  if (activeSubscriptionRenewalHandle === null) {
    const handle = await startSubscriptionRenewalWorker(container)
    if (handle !== null) {
      activeSubscriptionRenewalHandle = handle
    }
  }

  if (activeProvisionTenantHandle === null) {
    const handle = await startProvisionTenantWorker()
    if (handle !== null) {
      activeProvisionTenantHandle = handle
    }
  }

  registerShutdownHooks()
}

export async function stopWorkers(): Promise<void> {
  const notificationHandle = activeNotificationHandle
  const subscriptionRenewalHandle = activeSubscriptionRenewalHandle
  const provisionTenantHandle = activeProvisionTenantHandle
  activeNotificationHandle = null
  activeSubscriptionRenewalHandle = null
  activeProvisionTenantHandle = null

  if (notificationHandle !== null) {
    await stopNotificationWorker(notificationHandle)
  }

  if (subscriptionRenewalHandle !== null) {
    await stopSubscriptionRenewalWorker(subscriptionRenewalHandle)
  }

  if (provisionTenantHandle !== null) {
    await stopProvisionTenantWorker(provisionTenantHandle)
  }
}
