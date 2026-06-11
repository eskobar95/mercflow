import type { MedusaContainer } from "@medusajs/framework"
import { registerNotificationTemplates } from "@mercflow/notification-module/templates"

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

let activeHandle: NotificationWorkerHandle | null = null
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
  if (activeHandle !== null) {
    return
  }

  ensureNotificationTemplatesRegistered()
  activeHandle = await startNotificationWorker(container)
  registerShutdownHooks()
}

export async function stopWorkers(): Promise<void> {
  if (activeHandle === null) {
    return
  }

  const handle = activeHandle
  activeHandle = null
  await stopNotificationWorker(handle)
}
