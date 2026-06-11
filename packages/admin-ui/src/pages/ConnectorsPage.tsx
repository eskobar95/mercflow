import type { ReactNode } from "react"

import { ConnectorOverviewGrid } from "@/components/connectors/ConnectorOverviewGrid"
import { PageHeader } from "@/components/ui/PageHeader"
import { useAdminConnectors } from "@/hooks/useAdminConnectors"

import { settingsIntegrationsBreadcrumbs } from "@/config/settingsBreadcrumbs"

/**
 * Settings → Connectors overview (live data from `GET /admin/connectors`).
 */
export function ConnectorsPage(): ReactNode {
  const state = useAdminConnectors()

  return (
    <div className="p-6">
      <PageHeader
        title="Connectors"
        description="Review third-party integrations, their activation state, and open each connector's configuration workspace."
        breadcrumbs={settingsIntegrationsBreadcrumbs()}
      />

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
