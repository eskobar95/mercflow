import type { MedusaContainer } from "@medusajs/framework"
import type { Job, WorkerOptions } from "bullmq"
import { Queue, Worker } from "bullmq"
import IORedis from "ioredis"
import { createElement, type FC } from "react"
import { render } from "@react-email/render"

import { createSESClientFromEnv, type ISESClient } from "@mercflow/notification-module/ses-client"
import {
  DEFAULT_FALLBACK_FROM,
  NOTIFICATION_DLQ_NAME,
  NOTIFICATION_JOB_RETRY_OPTIONS,
  NOTIFICATION_MODULE,
  NOTIFICATION_QUEUE_NAME,
  SEND_EMAIL_JOB_NAME,
  type EmailConfigRecord,
  type SendEmailJobPayload,
  type TemplateKey,
  type TemplateProps,
} from "@mercflow/notification-module/types"

export const templateRegistry = new Map<TemplateKey, FC<TemplateProps>>()

export type NotificationWorkerHandle = {
  worker: Worker<SendEmailJobPayload>
  connection: IORedis
  dlqConnection: IORedis
  deadLetterQueue: Queue<SendEmailJobPayload>
}

type NotificationWorkerService = {
  getEmailConfig: (storeId: string) => Promise<EmailConfigRecord>
  markDeliverySent: (
    storeId: string,
    deliveryId: string,
    sesMessageId: string
  ) => Promise<void>
  markDeliveryFailed: (
    storeId: string,
    deliveryId: string,
    errorMessage: string
  ) => Promise<void>
  markDeliveryDeadLetter: (
    storeId: string,
    deliveryId: string,
    errorMessage: string
  ) => Promise<void>
}

export type SendEmailProcessorDeps = {
  getEmailConfig: (storeId: string) => Promise<EmailConfigRecord>
  markDeliverySent: (
    storeId: string,
    deliveryId: string,
    sesMessageId: string
  ) => Promise<void>
  markDeliveryFailed: (
    storeId: string,
    deliveryId: string,
    errorMessage: string
  ) => Promise<void>
  markDeliveryDeadLetter: (
    storeId: string,
    deliveryId: string,
    errorMessage: string
  ) => Promise<void>
  sesClient: ISESClient
  templateRegistry: Map<TemplateKey, FC<TemplateProps>>
}

export function getNotificationWorkerConcurrency(): number {
  const raw = process.env.NOTIFICATION_WORKER_CONCURRENCY
  if (raw === undefined) {
    return 5
  }

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 5
  }

  return parsed
}

export function resolveFromEmail(emailConfig: EmailConfigRecord): string {
  const fallback = emailConfig.fallback_from ?? DEFAULT_FALLBACK_FROM
  if (emailConfig.ses_domain_status === "verified" && emailConfig.from_email !== null) {
    return emailConfig.from_email
  }

  return fallback
}

export function formatFromAddress(email: string, fromName: string | null): string {
  if (fromName !== null && fromName.length > 0) {
    return `${fromName} <${email}>`
  }

  return email
}

export function resolveEmailSubject(templateKey: string): string {
  return templateKey
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function buildTemplateProps(
  emailConfig: EmailConfigRecord,
  jobData: Record<string, unknown>
): TemplateProps {
  return {
    logoUrl: emailConfig.logo_url,
    brandColor: emailConfig.brand_color,
    fromName: emailConfig.from_name,
    replyTo: emailConfig.reply_to,
    supportEmail: emailConfig.support_email,
    ...jobData,
  }
}

export async function renderTemplate(
  key: TemplateKey,
  props: TemplateProps,
  registry: Map<TemplateKey, FC<TemplateProps>> = templateRegistry
): Promise<string> {
  const Template = registry.get(key)
  if (Template === undefined) {
    throw new Error(`Unknown email template "${key}"`)
  }

  return render(createElement(Template, props))
}

export function isFinalJobFailure(attemptsMade: number, maxAttempts: number): boolean {
  return attemptsMade >= maxAttempts
}

export function createSendEmailProcessor(
  deps: SendEmailProcessorDeps
): (job: Job<SendEmailJobPayload>) => Promise<void> {
  return async (job: Job<SendEmailJobPayload>): Promise<void> => {
    if (job.name !== SEND_EMAIL_JOB_NAME) {
      throw new Error(`Unexpected notification job name "${job.name}"`)
    }

    const { storeId, templateKey, to, data, deliveryId } = job.data

    try {
      const emailConfig = await deps.getEmailConfig(storeId)
      const fromEmail = resolveFromEmail(emailConfig)
      const html = await renderTemplate(templateKey, buildTemplateProps(emailConfig, data), deps.templateRegistry)
      const result = await deps.sesClient.sendEmail({
        from: formatFromAddress(fromEmail, emailConfig.from_name),
        to,
        subject: resolveEmailSubject(templateKey),
        html,
        replyTo: emailConfig.reply_to,
      })

      await deps.markDeliverySent(storeId, deliveryId, result.messageId)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      await deps.markDeliveryFailed(storeId, deliveryId, message)
      throw error
    }
  }
}

function createRedisConnection(redisUrl: string): IORedis {
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  })
}

export async function startNotificationWorker(
  container: MedusaContainer
): Promise<NotificationWorkerHandle> {
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379"
  const connection = createRedisConnection(redisUrl)
  const dlqConnection = createRedisConnection(redisUrl)

  const notificationService = container.resolve(NOTIFICATION_MODULE) as unknown as NotificationWorkerService

  const deadLetterQueue = new Queue<SendEmailJobPayload>(NOTIFICATION_DLQ_NAME, {
    connection: dlqConnection,
  })

  const processor = createSendEmailProcessor({
    getEmailConfig: (storeId) => notificationService.getEmailConfig(storeId),
    markDeliverySent: (storeId, deliveryId, sesMessageId) =>
      notificationService.markDeliverySent(storeId, deliveryId, sesMessageId),
    markDeliveryFailed: (storeId, deliveryId, errorMessage) =>
      notificationService.markDeliveryFailed(storeId, deliveryId, errorMessage),
    markDeliveryDeadLetter: (storeId, deliveryId, errorMessage) =>
      notificationService.markDeliveryDeadLetter(storeId, deliveryId, errorMessage),
    sesClient: createSESClientFromEnv(),
    templateRegistry,
  })

  const workerOptions: WorkerOptions = {
    connection,
    concurrency: getNotificationWorkerConcurrency(),
  }

  const worker = new Worker<SendEmailJobPayload>(
    NOTIFICATION_QUEUE_NAME,
    processor,
    workerOptions
  )

  worker.on("failed", (job, error) => {
    if (job === undefined) {
      return
    }

    const maxAttempts = job.opts.attempts ?? NOTIFICATION_JOB_RETRY_OPTIONS.attempts
    if (!isFinalJobFailure(job.attemptsMade, maxAttempts)) {
      return
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    const { storeId, deliveryId } = job.data

    void deadLetterQueue
      .add(SEND_EMAIL_JOB_NAME, job.data, {
        jobId: `dlq:${job.id ?? deliveryId}`,
      })
      .then(() =>
        notificationService.markDeliveryDeadLetter(storeId, deliveryId, errorMessage)
      )
      .catch(() => undefined)
  })

  return {
    worker,
    connection,
    dlqConnection,
    deadLetterQueue,
  }
}

export async function stopNotificationWorker(
  handle: NotificationWorkerHandle
): Promise<void> {
  await handle.worker.close()
  await handle.deadLetterQueue.close()
  await handle.connection.quit()
  await handle.dlqConnection.quit()
}
