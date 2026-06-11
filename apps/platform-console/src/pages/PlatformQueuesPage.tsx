import { useAuth } from "@clerk/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"

import { QueueJobDetailOverlay } from "@/components/queues/QueueJobDetailOverlay"
import { QueueJobTable } from "@/components/queues/QueueJobTable"
import { QueueStatsCard } from "@/components/queues/QueueStatsCard"
import {
  fetchPlatformQueueJobs,
  fetchPlatformQueues,
  retryPlatformQueueJob,
} from "@/lib/platformApi"
import type { PlatformQueueJobSummary } from "@/types/platformQueues"

const POLL_INTERVAL_MS = 10_000

export function PlatformQueuesPage(): React.ReactElement {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<PlatformQueueJobSummary | null>(null)
  const [retryError, setRetryError] = useState<string | null>(null)

  const queuesQuery = useQuery({
    queryKey: ["platform", "queues"],
    queryFn: () => fetchPlatformQueues(() => getToken()),
    refetchInterval: POLL_INTERVAL_MS,
  })

  const jobsQuery = useQuery({
    queryKey: ["platform", "queues", selectedQueue, "jobs"],
    queryFn: () => fetchPlatformQueueJobs(selectedQueue ?? "", () => getToken()),
    enabled: selectedQueue !== null,
    refetchInterval: POLL_INTERVAL_MS,
  })

  const retryMutation = useMutation({
    mutationFn: async (job: PlatformQueueJobSummary) => {
      if (!selectedQueue) {
        throw new Error("No queue selected")
      }
      return retryPlatformQueueJob(selectedQueue, job.id, () => getToken())
    },
    onMutate: async (job) => {
      setRetryError(null)
      if (!selectedQueue) {
        return { previousJobs: undefined }
      }

      await queryClient.cancelQueries({
        queryKey: ["platform", "queues", selectedQueue, "jobs"],
      })

      const previousJobs = queryClient.getQueryData<{
        jobs: PlatformQueueJobSummary[]
      }>(["platform", "queues", selectedQueue, "jobs"])

      if (previousJobs) {
        queryClient.setQueryData(["platform", "queues", selectedQueue, "jobs"], {
          ...previousJobs,
          jobs: previousJobs.jobs.filter((entry) => entry.id !== job.id),
        })
      }

      setSelectedJob(null)
      return { previousJobs }
    },
    onError: (error, _job, context) => {
      if (selectedQueue && context?.previousJobs) {
        queryClient.setQueryData(
          ["platform", "queues", selectedQueue, "jobs"],
          context.previousJobs,
        )
      }
      setRetryError(error instanceof Error ? error.message : "Retry failed")
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["platform", "queues"] }),
        selectedQueue
          ? queryClient.invalidateQueries({
              queryKey: ["platform", "queues", selectedQueue, "jobs"],
            })
          : Promise.resolve(),
      ])
    },
  })

  const queues = queuesQuery.data?.queues ?? []
  const jobs = jobsQuery.data?.jobs ?? []

  const selectedQueueLabel = useMemo(() => {
    if (!selectedQueue) {
      return null
    }
    return selectedQueue.replace(/-/g, " ")
  }, [selectedQueue])

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold text-content-primary">Queues</h2>
        <p className="mt-2 max-w-3xl text-sm text-content-secondary">
          Live BullMQ health across all platform queues. Data refreshes every 10
          seconds. Select a queue to inspect failed and dead-letter jobs.
        </p>
      </section>

      {queuesQuery.isLoading ? (
        <p className="text-sm text-content-secondary">Loading queue stats…</p>
      ) : null}

      {queuesQuery.isError ? (
        <p className="text-sm text-feedback-danger">
          {queuesQuery.error instanceof Error
            ? queuesQuery.error.message
            : "Failed to load queue stats"}
        </p>
      ) : null}

      {queues.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {queues.map((queue) => (
            <QueueStatsCard
              key={queue.name}
              queue={queue}
              selected={selectedQueue === queue.name}
              onSelect={(queueName) => {
                setSelectedQueue(queueName)
                setSelectedJob(null)
                setRetryError(null)
              }}
            />
          ))}
        </section>
      ) : null}

      {selectedQueue ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold capitalize text-content-primary">
              {selectedQueueLabel} — failed jobs
            </h3>
            {jobsQuery.isFetching ? (
              <span className="text-xs text-content-tertiary">Refreshing…</span>
            ) : null}
          </div>

          {jobsQuery.isLoading ? (
            <p className="text-sm text-content-secondary">Loading jobs…</p>
          ) : null}

          {jobsQuery.isError ? (
            <p className="text-sm text-feedback-danger">
              {jobsQuery.error instanceof Error
                ? jobsQuery.error.message
                : "Failed to load jobs"}
            </p>
          ) : null}

          {!jobsQuery.isLoading && !jobsQuery.isError ? (
            <QueueJobTable
              jobs={jobs}
              selectedJobId={selectedJob?.id ?? null}
              onSelectJob={(job) => {
                setSelectedJob(job)
                setRetryError(null)
              }}
            />
          ) : null}
        </section>
      ) : null}

      {selectedJob ? (
        <QueueJobDetailOverlay
          job={selectedJob}
          retryPending={retryMutation.isPending}
          retryError={retryError}
          onClose={() => {
            setSelectedJob(null)
            setRetryError(null)
          }}
          onRetry={() => retryMutation.mutate(selectedJob)}
        />
      ) : null}
    </div>
  )
}
