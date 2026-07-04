import type { Job, Queue } from "bullmq"
import { describe, expect, it, vi } from "vitest"

import { PlatformQueueMonitor } from "../src/lib/platform-queues/platform-queue-monitor"

function buildJob(overrides?: Partial<Job>): Job {
  return {
    id: "job_01",
    name: "send-email",
    data: { storeId: "store_01", templateKey: "order-confirmation" },
    failedReason: "SES unavailable",
    stacktrace: ["Error: SES unavailable", "    at sendEmail"],
    attemptsMade: 3,
    opts: { attempts: 3 },
    timestamp: Date.now() - 60_000,
    finishedOn: Date.now() - 30_000,
    getState: vi.fn().mockResolvedValue("failed"),
    retry: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as Job
}

function createQueueStub(
  name: string,
  behavior: {
    getJobCounts?: ReturnType<typeof vi.fn>
    getJobs?: ReturnType<typeof vi.fn>
    getJob?: ReturnType<typeof vi.fn>
    add?: ReturnType<typeof vi.fn>
    close?: ReturnType<typeof vi.fn>
  },
): Queue {
  return {
    name,
    getJobCounts:
      behavior.getJobCounts ??
      vi.fn().mockResolvedValue({
        active: 0,
        waiting: 0,
        failed: 0,
        delayed: 0,
      }),
    getJobs: behavior.getJobs ?? vi.fn().mockResolvedValue([]),
    getJob: behavior.getJob ?? vi.fn().mockResolvedValue(undefined),
    add: behavior.add ?? vi.fn(),
    close: behavior.close ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as Queue
}

describe("PlatformQueueMonitor", (): void => {
  it("aggregates queue stats including DLQ size", async (): Promise<void> => {
    const queueStubs = new Map<string, Queue>()

    const monitor = new PlatformQueueMonitor("redis://localhost:6379", (name) => {
      if (queueStubs.has(name)) {
        return queueStubs.get(name) as Queue
      }

      const stub = createQueueStub(
        name,
        name.endsWith("-dead")
          ? {
              getJobCounts: vi.fn().mockResolvedValue({
                waiting: 2,
                active: 0,
                delayed: 0,
                failed: 1,
              }),
            }
          : name === "mercflow-notifications"
            ? {
                getJobCounts: vi.fn().mockResolvedValue({
                  active: 1,
                  waiting: 4,
                  failed: 2,
                }),
                getJobs: vi.fn().mockResolvedValue([
                  buildJob({ finishedOn: Date.now() - 60_000 }),
                  buildJob({
                    id: "job_old",
                    finishedOn: Date.now() - 48 * 60 * 60 * 1000,
                  }),
                ]),
              }
            : {},
      )

      queueStubs.set(name, stub)
      return stub
    })

    const stats = await monitor.listQueueStats()
    const notifications = stats.find((entry) => entry.name === "notifications")

    expect(notifications).toMatchObject({
      active: 1,
      waiting: 4,
      failed: 2,
      completed_24h: 1,
      dlq_size: 3,
    })

    await monitor.close()
  })

  it("retries failed jobs in the main queue", async (): Promise<void> => {
    const job = buildJob()
    const mainQueue = createQueueStub("mercflow-notifications", {
      getJob: vi.fn().mockResolvedValue(job),
    })
    const dlq = createQueueStub("mercflow-notifications-dead", {})

    const monitor = new PlatformQueueMonitor("redis://localhost:6379", (name) => {
      if (name === "mercflow-notifications") {
        return mainQueue
      }
      return dlq
    })

    const result = await monitor.retryJob("notifications", "job_01")

    expect(result).toEqual({ retried: true, job_id: "job_01" })
    expect(job.retry).toHaveBeenCalledOnce()

    await monitor.close()
  })

  it("re-enqueues DLQ jobs into the main queue", async (): Promise<void> => {
    const dlqJob = buildJob({ id: "dlq:job_01" })
    const mainQueue = createQueueStub("mercflow-notifications", {
      getJob: vi.fn().mockResolvedValue(undefined),
      add: vi.fn().mockResolvedValue({ id: "retry:dlq:job_01:123" }),
    })
    const dlq = createQueueStub("mercflow-notifications-dead", {
      getJob: vi.fn().mockResolvedValue(dlqJob),
    })

    const monitor = new PlatformQueueMonitor("redis://localhost:6379", (name) => {
      if (name === "mercflow-notifications") {
        return mainQueue
      }
      return dlq
    })

    const result = await monitor.retryJob("notifications", "dlq:job_01")

    expect(result.retried).toBe(true)
    expect(mainQueue.add).toHaveBeenCalledOnce()
    expect(dlqJob.remove).toHaveBeenCalledOnce()

    await monitor.close()
  })
})
