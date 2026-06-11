import type { PlatformQueueJobSummary } from "@/types/platformQueues"

type Props = {
  job: PlatformQueueJobSummary
  retryPending: boolean
  retryError: string | null
  onClose: () => void
  onRetry: () => void
}

export function QueueJobDetailOverlay({
  job,
  retryPending,
  retryError,
  onClose,
  onRetry,
}: Props): React.ReactElement {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="queue-job-detail-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg border border-border-subtle bg-surface-raised p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              id="queue-job-detail-title"
              className="text-lg font-semibold text-content-primary"
            >
              Job detail
            </h3>
            <p className="mt-1 font-mono text-xs text-content-tertiary">{job.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border-subtle px-3 py-1.5 text-sm text-content-secondary hover:bg-surface-subtle"
          >
            Close
          </button>
        </div>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-content-secondary">Queue job name</dt>
            <dd className="mt-1 text-content-primary">{job.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-content-secondary">Status</dt>
            <dd className="mt-1 capitalize text-content-primary">
              {job.status.replace("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-content-secondary">Attempts</dt>
            <dd className="mt-1 text-content-primary">
              {job.attempts_made}
              {job.max_attempts !== null ? ` / ${job.max_attempts}` : ""}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-content-secondary">Source</dt>
            <dd className="mt-1 uppercase text-content-primary">{job.source}</dd>
          </div>
        </dl>

        <section className="mt-6">
          <h4 className="text-sm font-semibold text-content-primary">Data preview</h4>
          <pre className="mt-2 overflow-x-auto rounded-md bg-surface-subtle p-3 text-xs text-content-secondary">
            {job.data_preview}
          </pre>
        </section>

        <section className="mt-6">
          <h4 className="text-sm font-semibold text-content-primary">Error message</h4>
          <p className="mt-2 rounded-md border border-feedback-danger-border bg-feedback-danger-subtle px-3 py-2 text-sm text-feedback-danger-content">
            {job.error_message ?? "No error message recorded"}
          </p>
        </section>

        <section className="mt-6">
          <h4 className="text-sm font-semibold text-content-primary">Stack trace</h4>
          {job.stack_trace.length > 0 ? (
            <pre className="mt-2 overflow-x-auto rounded-md bg-surface-subtle p-3 text-xs text-content-secondary">
              {job.stack_trace.join("\n")}
            </pre>
          ) : (
            <p className="mt-2 text-sm text-content-tertiary">No stack trace recorded.</p>
          )}
        </section>

        {retryError ? (
          <p className="mt-4 text-sm text-feedback-danger">{retryError}</p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onRetry}
            disabled={retryPending}
            className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse hover:bg-interactive-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {retryPending ? "Retrying…" : "Retry job"}
          </button>
        </div>
      </div>
    </div>
  )
}
