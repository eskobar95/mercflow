import type { ReactNode } from "react"

export function EmailSettingsDomainTabPlaceholder(): ReactNode {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-default p-6">
      <p className="text-sm text-content-secondary">
        Domain setup and DNS verification will appear here once SES domain onboarding is wired in
        admin.
      </p>
    </div>
  )
}
