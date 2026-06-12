import type { ReactNode } from "react"

import { AppConnectorCard } from "@/components/connectors/AppConnectorCard"
import { PageHeader } from "@/components/ui/PageHeader"
import { settingsAppsBreadcrumbs } from "@/config/settingsBreadcrumbs"
import { useAdminConnectors } from "@/hooks/useAdminConnectors"

/**
 * Settings → Apps → Overview — connector status grid with contextual configure links.
 */
export function AppsOverviewSettingsPage(): ReactNode {
  const state = useAdminConnectors()

  return (
    <div className="p-6">
      <PageHeader
        title="Apps"
        description="Review third-party integrations, their connection status, and open each app's configuration workspace."
        breadcrumbs={settingsAppsBreadcrumbs()}
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
          <p className="font-medium">Could not load apps</p>
          <p className="mt-1 text-content-secondary">{state.message}</p>
        </div>
      ) : null}

      {state.status === "success" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {state.connectors.map((item) => (
            <AppConnectorCard key={item.type} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
