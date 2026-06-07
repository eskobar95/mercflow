import type { ReactNode } from "react"
import { PlaceholderPage } from "@/pages/PlaceholderPage"

export function SettingsPage(): ReactNode {
  return (
    <PlaceholderPage
      title="General settings"
      description="Workspace defaults — store name, locales, taxes, shipping zones, currencies, and the notifications operators receive."
      fallback={{ label: "Open Connectors", to: "/settings/connectors" }}
    />
  )
}
