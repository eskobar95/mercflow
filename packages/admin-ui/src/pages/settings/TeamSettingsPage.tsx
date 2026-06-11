import type { ReactNode } from "react"

import { PlaceholderPage } from "@/pages/PlaceholderPage"

import { settingsBreadcrumb } from "@/config/settingsBreadcrumbs"

export function TeamSettingsPage(): ReactNode {
  return (
    <PlaceholderPage
      title="Team"
      description="Invite teammates, assign owner / admin / support roles, and audit the last sign-in for each member."
      breadcrumbs={settingsBreadcrumb("Team")}
      fallback={{ label: "Open General settings", to: "/settings" }}
    />
  )
}
