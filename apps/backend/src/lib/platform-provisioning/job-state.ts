import IORedis from "ioredis"

import {
  createInitialProvisioningJobState,
  PROVISIONING_JOB_STATE_PREFIX,
  PROVISIONING_JOB_STATE_TTL_SECONDS,
  type ProvisioningJobState,
  type ProvisioningStepKey,
  type ProvisioningStepStatus,
} from "./constants"

let redisClient: IORedis | null = null

function getRedisClient(): IORedis {
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379"
  redisClient ??= new IORedis(redisUrl, { maxRetriesPerRequest: null })
  return redisClient
}

function jobStateKey(jobId: string): string {
  return `${PROVISIONING_JOB_STATE_PREFIX}${jobId}`
}

export async function initProvisioningJobState(jobId: string): Promise<ProvisioningJobState> {
  const state = createInitialProvisioningJobState(jobId)
  const redis = getRedisClient()
  await redis.set(
    jobStateKey(jobId),
    JSON.stringify(state),
    "EX",
    PROVISIONING_JOB_STATE_TTL_SECONDS,
  )
  return state
}

export async function getProvisioningJobState(
  jobId: string,
): Promise<ProvisioningJobState | null> {
  const redis = getRedisClient()
  const raw = await redis.get(jobStateKey(jobId))
  if (!raw) {
    return null
  }

  return JSON.parse(raw) as ProvisioningJobState
}

async function persistProvisioningJobState(state: ProvisioningJobState): Promise<void> {
  const redis = getRedisClient()
  state.updated_at = new Date().toISOString()
  await redis.set(
    jobStateKey(state.job_id),
    JSON.stringify(state),
    "EX",
    PROVISIONING_JOB_STATE_TTL_SECONDS,
  )
}

export async function updateProvisioningJobStatus(
  jobId: string,
  status: ProvisioningJobState["status"],
): Promise<ProvisioningJobState | null> {
  const state = await getProvisioningJobState(jobId)
  if (!state) {
    return null
  }

  state.status = status
  await persistProvisioningJobState(state)
  return state
}

export async function updateProvisioningStep(
  jobId: string,
  stepKey: ProvisioningStepKey,
  input: { status: ProvisioningStepStatus; message?: string | null },
): Promise<ProvisioningJobState | null> {
  const state = await getProvisioningJobState(jobId)
  if (!state) {
    return null
  }

  const step = state.steps.find((entry) => entry.key === stepKey)
  if (!step) {
    return state
  }

  step.status = input.status
  if (input.message !== undefined) {
    step.message = input.message
  }

  if (state.status === "queued" && input.status === "running") {
    state.status = "running"
  }

  await persistProvisioningJobState(state)
  return state
}

export async function completeProvisioningJob(
  jobId: string,
  result: {
    store_id: string
    tenant_url: string
    admin_url: string
    artifacts?: ProvisioningJobState["artifacts"]
  },
): Promise<ProvisioningJobState | null> {
  const state = await getProvisioningJobState(jobId)
  if (!state) {
    return null
  }

  state.status = "completed"
  state.store_id = result.store_id
  state.tenant_url = result.tenant_url
  state.admin_url = result.admin_url
  if (result.artifacts) {
    state.artifacts = result.artifacts
  }
  state.error = null
  await persistProvisioningJobState(state)
  return state
}

export async function updateProvisioningArtifacts(
  jobId: string,
  artifacts: Partial<ProvisioningJobState["artifacts"]>,
): Promise<ProvisioningJobState | null> {
  const state = await getProvisioningJobState(jobId)
  if (!state) {
    return null
  }

  state.artifacts = {
    ...state.artifacts,
    ...artifacts,
  }

  if (artifacts.sales_channel_id !== undefined) {
    // no-op alias for store_id updates via separate helper
  }

  await persistProvisioningJobState(state)
  return state
}

export async function setProvisioningStoreId(
  jobId: string,
  storeId: string,
): Promise<ProvisioningJobState | null> {
  const state = await getProvisioningJobState(jobId)
  if (!state) {
    return null
  }

  state.store_id = storeId
  await persistProvisioningJobState(state)
  return state
}

export async function failProvisioningJob(
  jobId: string,
  errorMessage: string,
): Promise<ProvisioningJobState | null> {
  const state = await getProvisioningJobState(jobId)
  if (!state) {
    return null
  }

  state.status = "failed"
  state.error = errorMessage
  await persistProvisioningJobState(state)
  return state
}

export async function closeProvisioningJobStateClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}
