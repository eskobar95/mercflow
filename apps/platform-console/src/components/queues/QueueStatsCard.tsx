import type { PlatformQueueStats } from "@/types/platformQueues"

type Props = {
  queue: PlatformQueueStats
  selected: boolean
  onSelect: (queueName: string) => void
}

function formatCount(value: number): string {
  return value.toLocaleString()
}

export function QueueStatsCard({
  queue,
  selected,
  onSelect,
}: Props): React.ReactElement {
  const hasDlq = queue.dlq_size > 0

  return (
    <button
      type="button"
      onClick={() => onSelect(queue.name)}
      aria-pressed={selected}
      className={`w-full rounded-lg border p-4 text-left transition-colors ${
        selected
          ? "border-border-strong bg-surface-subtle"
          : "border-border-subtle bg-surface-raised hover:border-border-strong hover:bg-surface-subtle"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold capitalize text-content-primary">
            {queue.name.replace(/-/g, " ")}
          </h3>
          <p className="mt-1 font-mono text-xs text-content-tertiary">
            {queue.queue_name}
          </p>
        </div>
        {hasDlq ? (
          <span className="rounded-full bg-feedback-danger-subtle px-2 py-0.5 text-xs font-semibold text-feedback-danger-content">
            DLQ {formatCount(queue.dlq_size)}
          </span>
        ) : (
          <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-xs text-content-tertiary">
            DLQ 0
          </span>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-content-tertiary">Active</dt>
          <dd className="font-medium text-content-primary">{formatCount(queue.active)}</dd>
        </div>
        <div>
          <dt className="text-content-tertiary">Waiting</dt>
          <dd className="font-medium text-content-primary">{formatCount(queue.waiting)}</dd>
        </div>
        <div>
          <dt className="text-content-tertiary">Completed (24h)</dt>
          <dd className="font-medium text-content-primary">
            {formatCount(queue.completed_24h)}
          </dd>
        </div>
        <div>
          <dt className="text-content-tertiary">Failed</dt>
          <dd
            className={`font-medium ${queue.failed > 0 ? "text-feedback-danger" : "text-content-primary"}`}
          >
            {formatCount(queue.failed)}
          </dd>
        </div>
      </dl>
    </button>
  )
}
