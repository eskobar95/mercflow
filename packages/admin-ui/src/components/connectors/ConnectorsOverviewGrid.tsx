import { Link } from "react-router-dom"

import { Badge, type BadgeVariant } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import { buttonFocusClass } from "@/components/ui/formStyles"
import { cn } from "@/lib/cn"

import { getConnectorPresentation } from "@/features/connectors/connectorPresentation"
import type { ConnectorAdminListItem } from "@/features/connectors/types"
import {
  connectorDetailPath,
  connectorOverviewBadge,
  type ConnectorOverviewBadgeLabel,
} from "@/features/connectors/useConnectorsOverview"

const configureLinkClass = cn(
  "inline-flex h-9 w-full items-center justify-center rounded-sm border border-border-default bg-surface-appCard px-3.5 text-sm font-medium text-content-primary transition duration-150 hover:border-border-strong hover:bg-surface-subtle",
  buttonFocusClass,
)

function badgeVariantForLabel(label: ConnectorOverviewBadgeLabel): BadgeVariant {
  switch (label) {
    case "Active":
      return "success"
    case "Inactive":
      return "neutral"
    case "Not configured":
      return "warning"
    default: {
      const _exhaustive: never = label
      return _exhaustive
    }
  }
}

export type ConnectorsOverviewGridProps = {
  items: ConnectorAdminListItem[]
}

/**
 * Responsive grid of connector tiles for Settings → Connectors.
 */
export function ConnectorsOverviewGrid({ items }: ConnectorsOverviewGridProps): JSX.Element {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((row) => {
        const meta = getConnectorPresentation(row.type)
        const badgeLabel = connectorOverviewBadge(row)
        return (
          <li key={row.type}>
            <Card elevation="flat" compact className="flex h-full flex-col gap-4">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border-default bg-accent-subtle text-xs font-semibold uppercase tracking-wide text-accent-text"
                  role="img"
                  aria-label={`${meta.title} connector`}
                >
                  <span aria-hidden>{meta.mark.slice(0, 2)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-content-primary">{meta.title}</p>
                  <p className="mt-1 text-xs text-content-secondary">{meta.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={badgeVariantForLabel(badgeLabel)}>{badgeLabel}</Badge>
                {row.lastTestedAt !== null ? (
                  <span className="text-2xs text-content-tertiary">
                    Last tested {new Date(row.lastTestedAt).toLocaleString()}
                  </span>
                ) : null}
              </div>
              <Link
                to={connectorDetailPath(row.type)}
                className={configureLinkClass}
                aria-label={`Configure ${meta.title}`}
              >
                Configure
              </Link>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
