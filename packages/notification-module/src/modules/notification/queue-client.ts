import { Queue } from "bullmq"
import IORedis from "ioredis"

import type { SendEmailJobPayload } from "./types"
import { NOTIFICATION_QUEUE_NAME, SEND_EMAIL_JOB_NAME } from "./types"

export type NotificationQueueClient = {
  getJob(jobId: string): Promise<{ id: string } | null>
  addSendEmailJob(jobId: string, payload: SendEmailJobPayload): Promise<void>
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
      await queue.add(SEND_EMAIL_JOB_NAME, payload, { jobId })
    },
  }
}
