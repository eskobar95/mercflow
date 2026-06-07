import type { ReactNode } from "react"

import { PlaceholderPage } from "@/pages/PlaceholderPage"

export function BillingSettingsPage(): ReactNode {
  return (
    <PlaceholderPage
      title="Billing"
      description="Current plan, invoices, billing cycle, and the card on file for your MercFlow workspace."
      fallback={{ label: "Open General settings", to: "/settings" }}
    />
  )
}
