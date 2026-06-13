import { randomUUID } from "node:crypto"

import { Queue } from "bullmq"
import IORedis from "ioredis"

import {
  PROVISION_TENANT_JOB,
  PROVISION_TENANT_JOB_RETRY_OPTIONS,
  PROVISION_TENANT_QUEUE_NAME,
  type ProvisionTenantJobPayload,
} from "./constants"
import { initProvisioningJobState } from "./job-state"
import type { SignupProvisionBody } from "./validators"

let queueConnection: IORedis | null = null
let provisionQueue: Queue<ProvisionTenantJobPayload> | null = null

function getQueueConnection(): IORedis {
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379"
  queueConnection ??= new IORedis(redisUrl, { maxRetriesPerRequest: null })
  return queueConnection
}

function getProvisionTenantQueue(): Queue<ProvisionTenantJobPayload> {
  provisionQueue ??= new Queue<ProvisionTenantJobPayload>(PROVISION_TENANT_QUEUE_NAME, {
    connection: getQueueConnection(),
  })
  return provisionQueue
}

export type EnqueueProvisionTenantResult = {
  job_id: string
}

export async function enqueueProvisionTenantJob(
  body: SignupProvisionBody,
  billing: {
    stripe_customer_id: string
    stripe_payment_intent_id: string
    stripe_subscription_id: string | null
  },
): Promise<EnqueueProvisionTenantResult> {
  const jobId = randomUUID()
  const payload: ProvisionTenantJobPayload = {
    jobId,
    inviteToken: body.invite_token,
    clerkUserId: body.clerk_user_id,
    storeName: body.store_name,
    domain: body.domain,
    email: body.email,
    currency: body.currency,
    country: body.country,
    timezone: body.timezone,
    stripeCustomerId: billing.stripe_customer_id,
    stripePaymentIntentId: billing.stripe_payment_intent_id,
    stripeSubscriptionId: billing.stripe_subscription_id,
  }

  await initProvisioningJobState(jobId)

  const queue = getProvisionTenantQueue()
  await queue.add(PROVISION_TENANT_JOB, payload, {
    jobId,
    ...PROVISION_TENANT_JOB_RETRY_OPTIONS,
  })

  return { job_id: jobId }
}

export async function closeProvisionTenantQueue(): Promise<void> {
  if (provisionQueue) {
    await provisionQueue.close()
    provisionQueue = null
  }

  if (queueConnection) {
    await queueConnection.quit()
    queueConnection = null
  }
}
