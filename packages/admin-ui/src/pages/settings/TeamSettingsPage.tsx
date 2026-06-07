import type { ReactNode } from "react"

import { PlaceholderPage } from "@/pages/PlaceholderPage"

export function TeamSettingsPage(): ReactNode {
  return (
    <PlaceholderPage
      title="Team"
      description="Invite teammates, assign owner / admin / support roles, and audit the last sign-in for each member."
      fallback={{ label: "Open General settings", to: "/settings" }}
    />
  )
}
