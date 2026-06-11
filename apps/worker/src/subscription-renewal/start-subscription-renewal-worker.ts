import type { MedusaContainer } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type { Job, WorkerOptions } from "bullmq"
import { Queue, Worker } from "bullmq"
import IORedis from "ioredis"
import StripeSdk from "stripe"

import { CONNECTOR_MODULE } from "@mercflow/connector-module"
import { SUBSCRIPTION_MODULE } from "@mercflow/subscription-module"

import {
  CHARGE_SUBSCRIPTION_JOB,
  HANDLE_RENEWAL_FAILURE_JOB,
  PROCESS_DUE_RENEWALS_JOB,
  SUBSCRIPTION_RENEWAL_CRON_JOB_ID,
  SUBSCRIPTION_RENEWAL_CRON_PATTERN,
  SUBSCRIPTION_RENEWAL_DLQ_NAME,
  SUBSCRIPTION_RENEWAL_JOB_RETRY_OPTIONS,
  SUBSCRIPTION_RENEWAL_QUEUE_NAME,
  type ChargeSubscriptionJobPayload,
  type HandleRenewalFailureJobPayload,
} from "../types"
import { chargeSubscription } from "./charge-subscription"
import { createRenewalOrderDraft } from "./create-renewal-order"
import { createSubscriptionEventEmitter } from "./emit-subscription-event"
import { handleRenewalFailure } from "./handle-renewal-failure"
import {
  createChargeSubscriptionEnqueue,
  processDueRenewals,
} from "./process-due-renewals"
import { resolveRenewalPaymentContext } from "./resolve-renewal-payment-context"
import type { StripePaymentIntentClient } from "./stripe-charge"

type SubscriptionRenewalService = {
  listDueRenewals: (storeId: string, asOf?: Date) => Promise<
    Array<{
      id: string
      customer_id: string
      variant_id: string
      status: string
      next_renewal_at: string | Date
    }>
  >
  getSubscription: (
    storeId: string,
    subscriptionId: string
  ) => Promise<{
    subscription: {
      id: string
      customer_id: string
      variant_id: string
      status: string
      next_renewal_at: string | Date
    }
  }>
  completeRenewalSuccess: (
    storeId: string,
    subscriptionId: string,
    input: {
      order_id: string
      amount: number
      currency: string
      stripe_payment_intent_id: string
      renewed_at: Date
    }
  ) => Promise<unknown>
  recordRenewalFailure: (
    storeId: string,
    subscriptionId: string,
    input: {
      order_id: string
      amount: number
      currency: string
      stripe_payment_intent_id?: string | null
      error_message: string
    }
  ) => Promise<unknown>
}

type ConnectorStripeService = {
  resolveStripeSecretKeyOrNull: () => Promise<string | null>
}

type StoreModule = {
  listStores: (
    filters?: Record<string, unknown>,
    config?: { select?: string[] }
  ) => Promise<Array<{ id: string }>>
}

export type SubscriptionRenewalWorkerHandle = {
  worker: Worker
  queue: Queue
  deadLetterQueue: Queue
  connection: IORedis
  dlqConnection: IORedis
}

let workerStarted = false

function createRedisConnection(redisUrl: string): IORedis {
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  })
}

export async function startSubscriptionRenewalWorker(
  container: MedusaContainer
): Promise<SubscriptionRenewalWorkerHandle | null> {
  if (workerStarted || process.env.MEDUSA_WORKER_MODE === "server") {
    return null
  }

  workerStarted = true
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379"
  const connection = createRedisConnection(redisUrl)
  const dlqConnection = createRedisConnection(redisUrl)

  const subscriptionService = container.resolve(
    SUBSCRIPTION_MODULE
  ) as unknown as SubscriptionRenewalService
  const connectorService = container.resolve(
    CONNECTOR_MODULE
  ) as unknown as ConnectorStripeService

  const queue = new Queue(SUBSCRIPTION_RENEWAL_QUEUE_NAME, { connection })
  const deadLetterQueue = new Queue(SUBSCRIPTION_RENEWAL_DLQ_NAME, {
    connection: dlqConnection,
  })
  const events = createSubscriptionEventEmitter(queue)

  const processor = async (job: Job): Promise<void> => {
    if (job.name === PROCESS_DUE_RENEWALS_JOB) {
      await processDueRenewals({
        listStoreIds: async () => {
          const stores = await (
            container.resolve(Modules.STORE) as StoreModule
          ).listStores({}, { select: ["id"] })
          return stores.map((store) => store.id)
        },
        listDueRenewals: (storeId, asOf) =>
          subscriptionService.listDueRenewals(storeId, asOf),
        enqueueChargeSubscription: createChargeSubscriptionEnqueue(
          (name, data, options) => queue.add(name, data, options)
        ),
      })
      return
    }

    if (job.name === CHARGE_SUBSCRIPTION_JOB) {
      await chargeSubscription(
        {
          getSubscription: async (storeId, subscriptionId) => {
            const detail = await subscriptionService.getSubscription(
              storeId,
              subscriptionId
            )
            return detail.subscription
          },
          createRenewalOrderDraft: (storeId, subscription) =>
            createRenewalOrderDraft(container, storeId, subscription),
          resolveRenewalPaymentContext: (_storeId, subscription) =>
            resolveRenewalPaymentContext(container, subscription),
          resolveStripeClient: async () => {
            const secret = await connectorService.resolveStripeSecretKeyOrNull()
            if (secret === null) {
              return null
            }
            return new StripeSdk(secret) as unknown as StripePaymentIntentClient
          },
          completeRenewalSuccess: (storeId, subscriptionId, input) =>
            subscriptionService.completeRenewalSuccess(
              storeId,
              subscriptionId,
              input
            ),
          enqueueRenewalFailure: async (payload) => {
            await queue.add(HANDLE_RENEWAL_FAILURE_JOB, payload, {
              jobId: `${HANDLE_RENEWAL_FAILURE_JOB}:${payload.storeId}:${payload.subscriptionId}:${payload.orderId}`,
              ...SUBSCRIPTION_RENEWAL_JOB_RETRY_OPTIONS,
            })
          },
          events,
        },
        job.data as ChargeSubscriptionJobPayload
      )
      return
    }

    if (job.name === HANDLE_RENEWAL_FAILURE_JOB) {
      await handleRenewalFailure(
        {
          recordRenewalFailure: (storeId, subscriptionId, input) =>
            subscriptionService.recordRenewalFailure(
              storeId,
              subscriptionId,
              input
            ),
          events,
        },
        job.data as HandleRenewalFailureJobPayload
      )
    }
  }

  const worker = new Worker(SUBSCRIPTION_RENEWAL_QUEUE_NAME, processor, {
    connection,
    concurrency: 3,
  } satisfies WorkerOptions)

  worker.on("failed", (job) => {
    if (job === undefined) {
      return
    }

    const maxAttempts =
      job.opts.attempts ?? SUBSCRIPTION_RENEWAL_JOB_RETRY_OPTIONS.attempts
    if (job.attemptsMade < maxAttempts) {
      return
    }

    void deadLetterQueue
      .add(job.name, job.data, { jobId: `dlq:${job.id ?? "unknown"}` })
      .catch(() => undefined)
  })

  await queue.add(
    PROCESS_DUE_RENEWALS_JOB,
    {},
    {
      jobId: SUBSCRIPTION_RENEWAL_CRON_JOB_ID,
      repeat: { pattern: SUBSCRIPTION_RENEWAL_CRON_PATTERN },
      removeOnComplete: true,
      removeOnFail: 100,
    }
  )

  return { worker, queue, deadLetterQueue, connection, dlqConnection }
}

export async function stopSubscriptionRenewalWorker(
  handle: SubscriptionRenewalWorkerHandle
): Promise<void> {
  await handle.worker.close()
  await handle.queue.close()
  await handle.deadLetterQueue.close()
  await handle.connection.quit()
  await handle.dlqConnection.quit()
}
