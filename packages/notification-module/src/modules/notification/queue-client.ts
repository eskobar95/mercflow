import { Queue } from "bullmq"
import IORedis from "ioredis"

import type { SendEmailJobPayload } from "./types"
import {
  CHECK_PENDING_DOMAINS_JOB_NAME,
  DOMAIN_STATUS_POLL_INTERVAL_MS,
  DOMAIN_STATUS_POLL_SCHEDULER_ID,
  NOTIFICATION_JOB_RETRY_OPTIONS,
  NOTIFICATION_QUEUE_NAME,
  SEND_EMAIL_JOB_NAME,
} from "./types"

export type NotificationQueueClient = {
  getJob(jobId: string): Promise<{ id: string } | null>
  addSendEmailJob(jobId: string, payload: SendEmailJobPayload): Promise<void>
  scheduleDomainStatusPolling(): Promise<void>
}

export function buildEmailJobId(
  storeId: string,
  templateKey: string,
  entityId: string
): string {
  return `${storeId}:${templateKey}:${entityId}`
}

export function createBullMQNotificationQueueClient(
  redisUrl?: string
): NotificationQueueClient {
  const url = redisUrl ?? process.env.REDIS_URL ?? "redis://localhost:6379"
  const connection = new IORedis(url, {
    maxRetriesPerRequest: null,
  })

  const queue = new Queue(NOTIFICATION_QUEUE_NAME, { connection })

  return {
    async getJob(jobId: string): Promise<{ id: string } | null> {
      const job = await queue.getJob(jobId)
      if (job == null) {
        return null
      }
      return { id: job.id ?? jobId }
    },
    async addSendEmailJob(jobId: string, payload: SendEmailJobPayload): Promise<void> {
      await queue.add(SEND_EMAIL_JOB_NAME, payload, {
        jobId,
        ...NOTIFICATION_JOB_RETRY_OPTIONS,
      })
    },
    async scheduleDomainStatusPolling(): Promise<void> {
      await queue.add(
        CHECK_PENDING_DOMAINS_JOB_NAME,
        {},
        {
          jobId: DOMAIN_STATUS_POLL_SCHEDULER_ID,
          repeat: {
            every: DOMAIN_STATUS_POLL_INTERVAL_MS,
          },
          removeOnComplete: true,
          removeOnFail: 100,
        }
      )
    },
  }
}
