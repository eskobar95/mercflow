import type { ReactNode } from "react"
import { useSearchParams } from "react-router-dom"

import { PageHeader } from "@/components/ui/PageHeader"
import { parseEmailSettingsTab } from "@/config/emailSettingsTabs"
import { settingsEmailBreadcrumbs } from "@/config/settingsBreadcrumbs"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import { EmailBrandingTab } from "./email-settings/EmailBrandingTab"
import { EmailDeliveryHistoryTab } from "./email-settings/EmailDeliveryHistoryTab"
import { EmailSettingsDomainTabPlaceholder } from "./email-settings/EmailSettingsDomainTabPlaceholder"
import { EmailSettingsTabNav } from "./email-settings/EmailSettingsTabNav"

export function EmailSettingsPage(): ReactNode {
  const [searchParams] = useSearchParams()
  const activeTab = parseEmailSettingsTab(searchParams.get("tab"))
  const hasBackend = resolveMedusaAdminBackendUrl() !== null

  if (!hasBackend) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">
          Configure{" "}
          <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code> to
          manage email settings.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Email"
        description="Sending domain, branding, and delivery history for transactional emails."
        breadcrumbs={settingsEmailBreadcrumbs()}
      />

      <EmailSettingsTabNav />

      {activeTab === "domain" ? <EmailSettingsDomainTabPlaceholder /> : null}
      {activeTab === "branding" ? <EmailBrandingTab /> : null}
      {activeTab === "delivery-history" ? <EmailDeliveryHistoryTab /> : null}
    </div>
  )
}
