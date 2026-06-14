import type { ReactNode } from "react"
import { useSearchParams } from "react-router-dom"

import { PageHeader } from "@/components/ui/PageHeader"
import { parseDevelopersSettingsTab } from "@/config/developersSettingsTabs"
import { settingsDevelopersBreadcrumbs } from "@/config/settingsBreadcrumbs"
import { usePublishableApiKey } from "@/hooks/usePublishableApiKey"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import { DevelopersSettingsTabNav } from "./DevelopersSettingsTabNav"
import { DevelopersWebhooksTab } from "./DevelopersWebhooksTab"
import { PublishableApiKeyCard } from "./PublishableApiKeyCard"

export function DevelopersSettingsPage(): ReactNode {
  const [searchParams] = useSearchParams()
  const activeTab = parseDevelopersSettingsTab(searchParams.get("tab"))
  const apiKeyState = usePublishableApiKey()
  const hasBackend = resolveMedusaAdminBackendUrl() !== null

  if (!hasBackend) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">
          Configure{" "}
          <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code> to
          manage developer settings.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Developers"
        description="API keys for storefront integration and webhook endpoints for external services."
        breadcrumbs={settingsDevelopersBreadcrumbs()}
      />

      <DevelopersSettingsTabNav />

      {activeTab === "api-keys" ? (
        <>
          {apiKeyState.status === "loading" ? (
            <div
              className="h-48 animate-pulse rounded-lg border border-border-subtle bg-surface-subtle"
              aria-busy="true"
              aria-label="Loading publishable API key"
            />
          ) : null}

          {apiKeyState.status === "error" ? (
            <div
              role="alert"
              className="rounded-lg border border-interactive-danger-subtle bg-surface-default p-4 text-sm text-content-danger shadow-sm"
            >
              <p className="font-medium">Could not load API key</p>
              <p className="mt-1 text-content-secondary">{apiKeyState.message}</p>
            </div>
          ) : null}

          {apiKeyState.status === "empty" ? (
            <div
              className="rounded-lg border border-border-default bg-surface-subtle px-4 py-6"
              role="status"
            >
              <p className="font-medium text-content-primary">No publishable API key</p>
              <p className="mt-2 text-sm text-content-secondary">
                A publishable key is created automatically when your store is provisioned. If none
                appears here, contact support or regenerate from your provisioning workflow.
              </p>
            </div>
          ) : null}

          {apiKeyState.status === "success" ? (
            <PublishableApiKeyCard
              apiKey={apiKeyState.key}
              revealedToken={apiKeyState.revealedToken}
              isRegenerating={apiKeyState.isRegenerating}
              regenerateError={apiKeyState.regenerateError}
              onRegenerate={apiKeyState.regenerate}
            />
          ) : null}
        </>
      ) : null}

      {activeTab === "webhooks" ? <DevelopersWebhooksTab /> : null}
    </div>
  )
}
