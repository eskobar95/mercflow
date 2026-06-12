import type { ReactNode } from "react"

import type { ConnectorAppStatus } from "@/features/connectors/types"

const STYLE_BY_STATUS: Record<
  ConnectorAppStatus,
  { label: string; className: string }
> = {
  connected: {
    label: "Connected",
    className:
      "border-feedback-success-border bg-feedback-success-subtle text-feedback-success-content",
  },
  error: {
    label: "Error",
    className:
      "border-feedback-danger-border bg-feedback-danger-subtle text-feedback-danger-content",
  },
  not_configured: {
    label: "Not configured",
    className:
      "border-connectorStatus-inactive-border bg-connectorStatus-inactive-bg text-connectorStatus-inactive-text",
  },
}

type AppConnectorStatusBadgeProps = {
  status: ConnectorAppStatus
}

export function AppConnectorStatusBadge({
  status,
}: AppConnectorStatusBadgeProps): ReactNode {
  const cfg = STYLE_BY_STATUS[status]
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  )
}
