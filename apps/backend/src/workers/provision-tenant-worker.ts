import type { Job, WorkerOptions } from "bullmq"
import { Queue, Worker } from "bullmq"
import IORedis from "ioredis"

import {
  PROVISION_TENANT_DLQ_NAME,
  PROVISION_TENANT_JOB,
  PROVISION_TENANT_JOB_RETRY_OPTIONS,
  PROVISION_TENANT_QUEUE_NAME,
  type ProvisionTenantJobPayload,
} from "../lib/platform-provisioning/constants"
import { failProvisioningJob } from "../lib/platform-provisioning/job-state"
import { processProvisionTenantJob } from "../lib/platform-provisioning/process-provision-tenant-job"

export type ProvisionTenantWorkerHandle = {
  worker: Worker<ProvisionTenantJobPayload>
  queue: Queue<ProvisionTenantJobPayload>
  deadLetterQueue: Queue<ProvisionTenantJobPayload>
  connection: IORedis
  dlqConnection: IORedis
}

let workerStarted = false

function createRedisConnection(redisUrl: string): IORedis {
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  })
}

export async function startProvisionTenantWorker(): Promise<ProvisionTenantWorkerHandle | null> {
  if (workerStarted || process.env.MEDUSA_WORKER_MODE === "server") {
    return null
  }

  workerStarted = true
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379"

  try {
    const connection = createRedisConnection(redisUrl)
    const dlqConnection = createRedisConnection(redisUrl)

    const queue = new Queue<ProvisionTenantJobPayload>(PROVISION_TENANT_QUEUE_NAME, {
      connection,
    })
    const deadLetterQueue = new Queue<ProvisionTenantJobPayload>(PROVISION_TENANT_DLQ_NAME, {
      connection: dlqConnection,
    })

    const worker = new Worker<ProvisionTenantJobPayload>(
      PROVISION_TENANT_QUEUE_NAME,
      async (job: Job<ProvisionTenantJobPayload>) => {
        if (job.name !== PROVISION_TENANT_JOB) {
          return
        }
        await processProvisionTenantJob(job.data)
      },
      {
        connection,
        concurrency: 2,
      } satisfies WorkerOptions,
    )

    worker.on("failed", (job, error) => {
      if (job === undefined) {
        return
      }

      const maxAttempts =
        job.opts.attempts ?? PROVISION_TENANT_JOB_RETRY_OPTIONS.attempts

      if (job.attemptsMade < maxAttempts) {
        return
      }

      const message =
        error instanceof Error ? error.message : job.failedReason ?? "Provisioning failed"
      void failProvisioningJob(job.data.jobId, message).catch(() => undefined)

      void deadLetterQueue
        .add(job.name, job.data, { jobId: `dlq:${job.id ?? "unknown"}` })
        .catch(() => undefined)
    })

    return { worker, queue, deadLetterQueue, connection, dlqConnection }
  } catch (error) {
    workerStarted = false
    throw error
  }
}

export async function stopProvisionTenantWorker(
  handle: ProvisionTenantWorkerHandle,
): Promise<void> {
  await handle.worker.close()
  await handle.queue.close()
  await handle.deadLetterQueue.close()
  await handle.connection.quit()
  await handle.dlqConnection.quit()
}
