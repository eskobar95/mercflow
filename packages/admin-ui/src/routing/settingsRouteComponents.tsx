import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

import { PlaceholderPage } from "@/pages/PlaceholderPage"
import { SETTINGS_PATHS } from "@/config/settingsNav"

export function SettingsIndexRedirect(): ReactNode {
  return <Navigate to={SETTINGS_PATHS.general} replace />
}

export function SettingsGeneralPlaceholderRoute(): ReactNode {
  return (
    <PlaceholderPage
      title="General settings"
      description="Workspace defaults — store name, locales, taxes, shipping zones, currencies, and the notifications operators receive."
      fallback={{ label: "Back to settings", to: SETTINGS_PATHS.general }}
    />
  )
}

export function SettingsStoreDetailsPlaceholderRoute(): ReactNode {
  return (
    <PlaceholderPage
      title="Store details"
      description="Domain, branding, legal pages, and the public identity your storefront presents to customers."
      fallback={{ label: "Back to settings", to: SETTINGS_PATHS.general }}
    />
  )
}
