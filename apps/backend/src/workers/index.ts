import type { MedusaContainer } from "@medusajs/framework"

import {
  startNotificationWorker,
  stopNotificationWorker,
  type NotificationWorkerHandle,
} from "./notification-worker"

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
