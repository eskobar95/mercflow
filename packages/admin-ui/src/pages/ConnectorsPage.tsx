import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { ConnectorOverviewGrid } from "@/components/connectors/ConnectorOverviewGrid"
import { useAdminConnectors } from "@/hooks/useAdminConnectors"

/**
 * Settings → Connectors overview (live data from `GET /admin/connectors`).
 */
export function ConnectorsPage(): ReactNode {
  const state = useAdminConnectors()

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          to="/settings"
          className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
        >
          ← Settings
        </Link>
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
            Integrations
          </p>
          <h1 className="text-2xl font-semibold text-content-primary">Connectors</h1>
          <p className="max-w-2xl text-sm text-content-secondary">
            Review third-party integrations, their activation state, and open each connector&apos;s
            configuration workspace.
          </p>
        </div>
      </div>

      {state.status === "loading" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((key) => (
            <div
              key={`sk-${key}`}
              className="h-52 animate-pulse rounded-lg border border-border-subtle bg-surface-subtle"
            />
          ))}
        </div>
      ) : null}

      {state.status === "error" ? (
        <div
          role="alert"
          className="rounded-lg border border-interactive-danger-subtle bg-surface-default p-4 text-sm text-content-danger shadow-sm"
        >
          <p className="font-medium">Could not load connectors</p>
          <p className="mt-1 text-content-secondary">{state.message}</p>
        </div>
      ) : null}

      {state.status === "success" ? <ConnectorOverviewGrid connectors={state.connectors} /> : null}
    </div>
  )
}
