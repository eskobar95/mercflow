import { PlaceholderPage } from "@/pages/PlaceholderPage"

export function SettingsPage(): JSX.Element {
  return (
    <PlaceholderPage
      title="General settings"
      description="Workspace defaults — store name, locales, taxes, shipping zones, currencies, and the notifications operators receive."
      fallback={{ label: "Open Connectors", to: "/settings/connectors" }}
    />
  )
}
