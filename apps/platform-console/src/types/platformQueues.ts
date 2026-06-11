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

export type PlatformQueuesResponse = {
  queues: PlatformQueueStats[]
}

export type PlatformQueueJobsResponse = {
  queue: string
  status: "failed"
  jobs: PlatformQueueJobSummary[]
}

export type PlatformQueueRetryResponse = {
  retried: true
  job_id: string
}
