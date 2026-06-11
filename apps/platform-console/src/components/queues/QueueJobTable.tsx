import type { PlatformQueueJobSummary } from "@/types/platformQueues"

type Props = {
  jobs: PlatformQueueJobSummary[]
  selectedJobId: string | null
  onSelectJob: (job: PlatformQueueJobSummary) => void
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "—"
  }
  return new Date(value).toLocaleString()
}

export function QueueJobTable({
  jobs,
  selectedJobId,
  onSelectJob,
}: Props): React.ReactElement {
  if (jobs.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border-subtle bg-surface-subtle px-4 py-6 text-sm text-content-secondary">
        No failed or dead-letter jobs in this queue.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle">
      <table className="min-w-full divide-y divide-border-subtle text-sm">
        <thead className="bg-surface-subtle">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-medium text-content-secondary">
              Job ID
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-content-secondary">
              Name
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-content-secondary">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-content-secondary">
              Error
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-content-secondary">
              Attempts
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-content-secondary">
              Failed at
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle bg-surface-raised">
          {jobs.map((job) => (
            <tr
              key={`${job.source}:${job.id}`}
              className={`cursor-pointer transition-colors hover:bg-surface-subtle ${
                selectedJobId === job.id ? "bg-surface-subtle" : ""
              }`}
              onClick={() => onSelectJob(job)}
            >
              <td className="px-4 py-3 font-mono text-xs text-content-primary">{job.id}</td>
              <td className="px-4 py-3 text-content-primary">{job.name}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    job.status === "dead_letter"
                      ? "bg-feedback-danger-subtle text-feedback-danger-content"
                      : "bg-surface-subtle text-content-secondary"
                  }`}
                >
                  {job.status === "dead_letter" ? "Dead letter" : "Failed"}
                </span>
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-content-secondary">
                {job.error_message ?? "—"}
              </td>
              <td className="px-4 py-3 text-content-secondary">
                {job.attempts_made}
                {job.max_attempts !== null ? ` / ${job.max_attempts}` : ""}
              </td>
              <td className="px-4 py-3 text-content-secondary">
                {formatTimestamp(job.failed_at ?? job.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
