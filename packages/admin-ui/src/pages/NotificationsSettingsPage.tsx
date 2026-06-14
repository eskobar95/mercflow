import type { ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { PageHeader } from "@/components/ui/PageHeader"
import { Spinner } from "@/components/ui/Spinner"
import { settingsNotificationsBreadcrumbs } from "@/config/settingsBreadcrumbs"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import {
  NotificationBrandingSection,
  NotificationTemplatesSection,
} from "./notifications-settings/NotificationSettingsSections"
import { useNotificationsSettingsPage } from "./notifications-settings/useNotificationsSettingsPage"

export function NotificationsSettingsPage(): ReactNode {
  const hasBackend = resolveMedusaAdminBackendUrl() !== null
  const controller = useNotificationsSettingsPage()
  const { state, reload } = controller
  const { phase, message } = state

  if (!hasBackend) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">
          Configure{" "}
          <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code> to
          manage notification settings.
        </p>
      </div>
    )
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8" aria-busy aria-live="polite">
        <Spinner label="Loading notification settings" />
      </div>
    )
  }

  if (phase === "error") {
    return (
      <div className="p-6" role="alert">
        <PageHeader title="Notifications" breadcrumbs={settingsNotificationsBreadcrumbs()} />
        <Card className="mt-6 p-6">
          <p className="font-medium text-content-primary">Could not load notification settings.</p>
          <p className="mt-2 text-sm text-content-secondary">{message}</p>
          <Button type="button" variant="secondary" className="mt-6" onClick={() => void reload()}>
            Try again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Notifications"
        description="Configure email branding and choose which transactional templates are active."
        breadcrumbs={settingsNotificationsBreadcrumbs()}
      />

      <NotificationBrandingSection controller={controller} />
      <NotificationTemplatesSection controller={controller} />
    </div>
  )
}
