import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { Card } from "@/components/ui/Card"
import { CONNECTOR_CATALOG } from "@/features/connectors/connectorsCatalog"
import {
  resolveConnectorDisplayStatus,
  type ConnectorListItemDto,
} from "@/features/connectors/types"

import { ConnectorConnectionBadge } from "./ConnectorConnectionBadge"
import { ConnectorStatusBadge } from "./ConnectorStatusBadge"

type ConnectorCardProps = {
  item: ConnectorListItemDto
}

export function ConnectorCard({ item }: ConnectorCardProps): ReactNode {
  const catalog = CONNECTOR_CATALOG[item.type]
  const displayStatus = resolveConnectorDisplayStatus(item)

  return (
    <div data-testid={`connector-card-${item.type}`}>
      <Card className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-subtle text-sm font-semibold text-content-secondary"
            >
              {catalog.monogram}
            </div>
            <div>
              <p className="text-base font-semibold text-content-primary">{catalog.name}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <ConnectorStatusBadge status={displayStatus} />
            {item.configured && item.connectionHealth !== null ? (
              <ConnectorConnectionBadge health={item.connectionHealth} />
            ) : null}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-content-secondary">{catalog.description}</p>

        {item.lastTestedAt !== null ? (
          <p className="text-xs text-content-tertiary">
            Last tested{" "}
            <time dateTime={item.lastTestedAt}>
              {new Date(item.lastTestedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </time>
          </p>
        ) : (
          <p className="text-xs text-content-tertiary">No connection test recorded.</p>
        )}

        <div className="mt-auto pt-2">
          <Link
            to={`/settings/connectors/${encodeURIComponent(item.type)}`}
            className="inline-flex items-center justify-center rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm font-medium text-content-primary shadow-sm transition hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            Configure
          </Link>
        </div>
      </Card>
    </div>
  )
}
