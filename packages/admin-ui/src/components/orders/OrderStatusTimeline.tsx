import type { OrderTimelineStep } from "@/utils/buildOrderTimeline"

function formatTimelineTimestamp(iso: string | null): string {
  if (iso === null || iso.trim() === "") {
    return "—"
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return "—"
  }
  return d.toLocaleString("da-DK", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function OrderStatusTimeline(props: { steps: OrderTimelineStep[] }): JSX.Element {
  return (
    <ol className="space-y-0" aria-label="Order status timeline">
      {props.steps.map((step, index) => {
        const isLast = index === props.steps.length - 1
        const muted = !step.reached

        return (
          <li key={step.key} className="relative flex gap-3 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={`mt-0.5 h-3 w-3 shrink-0 rounded-full border ${
                  step.reached
                    ? "border-border-focus bg-interactive-primary"
                    : "border-border-subtle bg-surface-subtle"
                }`}
                aria-hidden
              />
              {!isLast ? (
                <span
                  className="mt-1 w-px flex-1 min-h-[1.75rem] shrink-0 bg-border-subtle"
                  aria-hidden
                />
              ) : null}
            </div>
            <div className={`min-w-0 flex-1 ${muted ? "opacity-60" : ""}`}>
              <p className="text-sm font-medium text-content-primary">{step.label}</p>
              <time
                className="text-xs text-content-tertiary"
                dateTime={step.timestampIso ?? undefined}
              >
                {formatTimelineTimestamp(step.timestampIso)}
              </time>
              {!step.reached ? (
                <p className="mt-0.5 text-xs text-content-secondary">Pending</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
