import type { ReactNode } from "react"

import { SettingsPlaceholderPage } from "@/pages/settings/SettingsPlaceholderPage"

export function TeamSettingsPage(): ReactNode {
  return (
    <SettingsPlaceholderPage
      title="Users"
      description="Invite teammates, assign owner / admin / support roles, and audit the last sign-in for each member."
    />
  )
}
