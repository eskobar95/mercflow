import type { Job } from "bullmq"
import { Queue } from "bullmq"
import IORedis from "ioredis"

import {
  PLATFORM_QUEUE_DEFINITIONS,
  resolvePlatformQueueDefinition,
  type PlatformQueueDefinition,
} from "./queue-registry"

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000
const COMPLETED_SCAN_LIMIT = 500
const JOB_LIST_LIMIT = 100

export type PlatformQueueStats = {
  name: string
  queue_name: string
  active: number
  waiting: number
  completed_24h: number
  failed: number
  dlq_size: number
}

export type PlatformQueueJobSummary = {
  id: string
  name: string
  status: "failed" | "dead_letter"
  data_preview: string
  error_message: string | null
  stack_trace: string[]
  attempts_made: number
  max_attempts: number | null
  created_at: string | null
  failed_at: string | null
  source: "queue" | "dlq"
}

export type PlatformQueueJobDetail = PlatformQueueJobSummary & {
  data: unknown
}

type QueueHandle = {
  queue: Queue
  dlq: Queue
}

type QueueFactory = (name: string, connection: IORedis) => Queue

function createRedisConnection(redisUrl: string): IORedis {
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  })
}

function serializeJobDataPreview(data: unknown): string {
  try {
    const serialized = JSON.stringify(data)
    if (serialized.length <= 160) {
      return serialized
    }
    return `${serialized.slice(0, 157)}...`
  } catch {
    return "[unserializable job data]"
  }
}

function toIsoTimestamp(value: number | undefined): string | null {
  if (value === undefined || !Number.isFinite(value)) {
    return null
  }
  return new Date(value).toISOString()
}

async function countCompletedInLast24Hours(queue: Queue): Promise<number> {
  const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS
  const completedJobs = await queue.getJobs(["completed"], 0, COMPLETED_SCAN_LIMIT, false)
  return completedJobs.filter((job) => (job.finishedOn ?? 0) >= cutoff).length
}

async function getDlqSize(dlq: Queue): Promise<number> {
  const counts = await dlq.getJobCounts("waiting", "active", "delayed", "failed")
  return counts.waiting + counts.active + counts.delayed + counts.failed
}

function mapJobSummary(
  job: Job,
  source: "queue" | "dlq",
  status: "failed" | "dead_letter",
): PlatformQueueJobSummary {
  return {
    id: String(job.id),
    name: job.name,
    status,
    data_preview: serializeJobDataPreview(job.data),
    error_message: job.failedReason ?? null,
    stack_trace: job.stacktrace ?? [],
    attempts_made: job.attemptsMade,
    max_attempts: job.opts.attempts ?? null,
    created_at: toIsoTimestamp(job.timestamp),
    failed_at: toIsoTimestamp(job.finishedOn),
    source,
  }
}

export class PlatformQueueMonitor {
  private readonly connection: IORedis
  private readonly handles = new Map<string, QueueHandle>()
  private readonly queueFactory: QueueFactory

  constructor(redisUrl: string, queueFactory?: QueueFactory) {
    this.connection = createRedisConnection(redisUrl)
    this.queueFactory =
      queueFactory ?? ((name, connection) => new Queue(name, { connection }))
  }

  private getHandle(definition: PlatformQueueDefinition): QueueHandle {
    const existing = this.handles.get(definition.name)
    if (existing) {
      return existing
    }

    const handle: QueueHandle = {
      queue: this.queueFactory(definition.queueName, this.connection),
      dlq: this.queueFactory(definition.dlqName, this.connection),
    }
    this.handles.set(definition.name, handle)
    return handle
  }

  async listQueueStats(): Promise<PlatformQueueStats[]> {
    const stats: PlatformQueueStats[] = []

    for (const definition of PLATFORM_QUEUE_DEFINITIONS) {
      const { queue, dlq } = this.getHandle(definition)
      const [counts, completed24h, dlqSize] = await Promise.all([
        queue.getJobCounts("active", "waiting", "failed"),
        countCompletedInLast24Hours(queue),
        getDlqSize(dlq),
      ])

      stats.push({
        name: definition.name,
        queue_name: definition.queueName,
        active: counts.active,
        waiting: counts.waiting,
        completed_24h: completed24h,
        failed: counts.failed,
        dlq_size: dlqSize,
      })
    }

    return stats
  }

  async listFailedJobs(queueName: string): Promise<PlatformQueueJobSummary[]> {
    const definition = resolvePlatformQueueDefinition(queueName)
    if (!definition) {
      return []
    }

    const { queue, dlq } = this.getHandle(definition)
    const [failedJobs, dlqJobs] = await Promise.all([
      queue.getJobs(["failed"], 0, JOB_LIST_LIMIT, false),
      dlq.getJobs(["waiting", "active", "delayed", "failed"], 0, JOB_LIST_LIMIT, false),
    ])

    const summaries = [
      ...failedJobs.map((job) => mapJobSummary(job, "queue", "failed")),
      ...dlqJobs.map((job) => mapJobSummary(job, "dlq", "dead_letter")),
    ]

    summaries.sort((left, right) => {
      const leftTime = left.failed_at ?? left.created_at ?? ""
      const rightTime = right.failed_at ?? right.created_at ?? ""
      return rightTime.localeCompare(leftTime)
    })

    return summaries
  }

  async getJobDetail(
    queueName: string,
    jobId: string,
  ): Promise<PlatformQueueJobDetail | null> {
    const definition = resolvePlatformQueueDefinition(queueName)
    if (!definition) {
      return null
    }

    const { queue, dlq } = this.getHandle(definition)
    const mainJob = await queue.getJob(jobId)
    if (mainJob) {
      const summary = mapJobSummary(
        mainJob,
        "queue",
        mainJob.failedReason ? "failed" : "failed",
      )
      return {
        ...summary,
        data: mainJob.data,
      }
    }

    const dlqJob = await dlq.getJob(jobId)
    if (dlqJob) {
      const summary = mapJobSummary(dlqJob, "dlq", "dead_letter")
      return {
        ...summary,
        data: dlqJob.data,
      }
    }

    return null
  }

  async retryJob(queueName: string, jobId: string): Promise<{ retried: true; job_id: string }> {
    const definition = resolvePlatformQueueDefinition(queueName)
    if (!definition) {
      throw new PlatformQueueMonitorError("NOT_FOUND", `Unknown queue "${queueName}"`)
    }

    const { queue, dlq } = this.getHandle(definition)
    const mainJob = await queue.getJob(jobId)
    if (mainJob) {
      const state = await mainJob.getState()
      if (state !== "failed") {
        throw new PlatformQueueMonitorError(
          "INVALID_STATE",
          `Job ${jobId} is ${state}; only failed jobs can be retried`,
        )
      }

      await mainJob.retry()
      return { retried: true, job_id: String(mainJob.id) }
    }

    const dlqJob = await dlq.getJob(jobId)
    if (!dlqJob) {
      throw new PlatformQueueMonitorError("NOT_FOUND", `Job ${jobId} not found in queue or DLQ`)
    }

    const retried = await queue.add(dlqJob.name, dlqJob.data, {
      jobId: `retry:${jobId}:${Date.now()}`,
      ...(dlqJob.opts.attempts !== undefined ? { attempts: dlqJob.opts.attempts } : {}),
      ...(dlqJob.opts.backoff !== undefined ? { backoff: dlqJob.opts.backoff } : {}),
    })

    await dlqJob.remove()
    return { retried: true, job_id: String(retried.id) }
  }

  async close(): Promise<void> {
    for (const handle of this.handles.values()) {
      await handle.queue.close()
      await handle.dlq.close()
    }
    this.handles.clear()
    await this.connection.quit()
  }
}

export class PlatformQueueMonitorError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "INVALID_STATE",
    message: string,
  ) {
    super(message)
    this.name = "PlatformQueueMonitorError"
  }
}

let monitorSingleton: PlatformQueueMonitor | null = null

export function getPlatformQueueMonitor(): PlatformQueueMonitor {
  if (!monitorSingleton) {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379"
    monitorSingleton = new PlatformQueueMonitor(redisUrl)
  }
  return monitorSingleton
}

export async function closePlatformQueueMonitor(): Promise<void> {
  if (monitorSingleton) {
    await monitorSingleton.close()
    monitorSingleton = null
  }
}
