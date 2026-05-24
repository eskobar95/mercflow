import type { ConnectorDisplayStatus } from "@/features/connectors/types"

const STYLE_BY_STATUS: Record<
  ConnectorDisplayStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className:
      "border border-connectorStatus-active-border bg-connectorStatus-active-bg text-connectorStatus-active-text",
  },
  inactive: {
    label: "Inactive",
    className:
      "border border-connectorStatus-inactive-border bg-connectorStatus-inactive-bg text-connectorStatus-inactive-text",
  },
  unconfigured: {
    label: "Not configured",
    className:
      "border border-connectorStatus-unconfigured-border bg-connectorStatus-unconfigured-bg text-connectorStatus-unconfigured-text",
  },
}

type ConnectorStatusBadgeProps = {
  status: ConnectorDisplayStatus
}

export function ConnectorStatusBadge({
  status,
}: ConnectorStatusBadgeProps): JSX.Element {
  const cfg = STYLE_BY_STATUS[status]
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  )
}
