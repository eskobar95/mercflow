import type { ReactNode } from "react"

export function EmailSettingsBrandingTabPlaceholder(): ReactNode {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-default p-6">
      <p className="text-sm text-content-secondary">
        Email branding fields and live preview will appear here. This tab is owned by the branding
        settings task.
      </p>
    </div>
  )
}
