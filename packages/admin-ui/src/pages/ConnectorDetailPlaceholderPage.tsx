import type { ReactNode } from "react"
import { Link, Navigate, useParams } from "react-router-dom"

import { Card } from "@/components/ui/Card"
import { CONNECTOR_CATALOG } from "@/features/connectors/connectorsCatalog"
import { CONNECTOR_SLUGS, type ConnectorSlug } from "@/features/connectors/types"

function parseConnectorSlugParam(raw: string | undefined): ConnectorSlug | null {
  if (!raw) {
    return null
  }
  const decoded = decodeURIComponent(raw).trim().toLowerCase()
  return (CONNECTOR_SLUGS as readonly string[]).includes(decoded)
    ? (decoded as ConnectorSlug)
    : null
}

/**
 * Sprint 3 replaces this placeholder with connector-specific forms; route exists so Configure links resolve.
 */
export function ConnectorDetailPlaceholderPage(): ReactNode {
  const { connectorType } = useParams<{ connectorType: string }>()
  const slug = parseConnectorSlugParam(connectorType)

  if (slug === "gtm") {
    return <Navigate to="/settings/connectors/gtm" replace />
  }

  return (
    <div className="p-6">
      <Link
        to="/settings/connectors"
        className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
      >
        ← Connectors
      </Link>

      {slug === null ? (
        <div className="mt-6" role="alert">
          <Card>
            <h1 className="text-xl font-semibold text-content-primary">Unknown connector</h1>
            <p className="mt-2 text-sm text-content-secondary">
              That connector type was not recognised. Pick one from the Connectors overview.
            </p>
          </Card>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <h1 className="text-2xl font-semibold text-content-primary">
            {CONNECTOR_CATALOG[slug].name}
          </h1>
          <p className="text-sm text-content-secondary">
            Detailed configuration workflows will ship per connector in Sprint 3.
          </p>
          <Card>
            <p className="text-sm text-content-secondary">
              Connector-specific configuration UI is not implemented yet. Identifier:{" "}
              <code className="text-xs text-content-tertiary">{slug}</code>.
            </p>
            {/* TODO MER-25 follow-up (Sprint 3) — interactive connector configuration for this slug. */}
          </Card>
        </div>
      )}
    </div>
  )
}
