import type { ConnectorConnectionHealthUi } from "@/features/connectors/types"

const STYLE_MAP: Record<
  ConnectorConnectionHealthUi,
  { label: string; className: string }
> = {
  ok: {
    label: "API reachable",
    className:
      "border-feedback-success-border bg-feedback-success-subtle text-feedback-success-content",
  },
  error: {
    label: "Last test failed",
    className:
      "border-feedback-danger-border bg-feedback-danger-subtle text-feedback-danger-content",
  },
  untested: {
    label: "Not tested yet",
    className:
      "border-feedback-warning-border bg-feedback-warning-subtle text-feedback-warning-content",
  },
}

type ConnectorConnectionBadgeProps = {
  health: ConnectorConnectionHealthUi
}

/** Summarises the last outbound Plunk/connectivity probe (only when a connector row exists). */
export function ConnectorConnectionBadge({ health }: ConnectorConnectionBadgeProps): JSX.Element {
  const cfg = STYLE_MAP[health]
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </span>
  )
}
