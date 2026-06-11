import type { MedusaContainer } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { Worker } from "bullmq"
import IORedis from "ioredis"

import { NOTIFICATION_MODULE } from "@mercflow/notification-module"
import {
  CHECK_PENDING_DOMAINS_JOB_NAME,
  NOTIFICATION_QUEUE_NAME,
} from "@mercflow/notification-module/types"

type DomainPollingService = {
  checkAllPendingDomainStatuses: (
    storeIds: readonly string[]
  ) => Promise<{ checked: number; updated: number }>
}

type StoreModule = {
  listStores: (
    filters?: Record<string, unknown>,
    config?: { select?: string[] }
  ) => Promise<Array<{ id: string }>>
}

let workerStarted = false

export async function startNotificationDomainStatusWorker(
  container: MedusaContainer
): Promise<void> {
  if (workerStarted || process.env.MEDUSA_WORKER_MODE === "server") {
    return
  }

  const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  })

  new Worker(
    NOTIFICATION_QUEUE_NAME,
    async (job) => {
      if (job.name !== CHECK_PENDING_DOMAINS_JOB_NAME) {
        return
      }
      const service = container.resolve(NOTIFICATION_MODULE) as unknown as DomainPollingService
      const stores = await (container.resolve(Modules.STORE) as StoreModule).listStores(
        {},
        { select: ["id"] }
      )
      await service.checkAllPendingDomainStatuses(stores.map((s) => s.id))
    },
    { connection }
  )

  workerStarted = true
}
