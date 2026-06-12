import type { ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"
import { PageHeader } from "@/components/ui/PageHeader"

import { settingsBreadcrumb } from "@/config/settingsBreadcrumbs"

type SettingsPlaceholderPageProps = {
  title: string
  description: string
}

/**
 * Reusable settings section placeholder — title, description, and Coming soon callout.
 * Sidebar active state is driven by the route path in `SETTINGS_NAV_GROUPS`.
 */
export function SettingsPlaceholderPage({
  title,
  description,
}: SettingsPlaceholderPageProps): ReactNode {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={settingsBreadcrumb(title)}
      />

      <div
        className="rounded-lg border border-border-default bg-surface-subtle px-4 py-3"
        role="status"
      >
        <Badge variant="neutral">Coming soon</Badge>
        <p className="mt-2 text-sm leading-relaxed text-content-secondary">
          This section is planned for a future release. Navigation and breadcrumbs stay in place
          so you can explore the full settings structure.
        </p>
      </div>
    </div>
  )
}
