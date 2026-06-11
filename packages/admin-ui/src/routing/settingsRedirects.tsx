import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

import { SETTINGS_PATHS } from "@/config/settingsSections"

function settingsRedirect(to: string): () => ReactNode {
  return function SettingsRedirectRoute(): ReactNode {
    return <Navigate to={to} replace />
  }
}

export const RedirectToShippingPackaging = settingsRedirect(SETTINGS_PATHS.shippingPackaging)
export const RedirectToShippingCarriers = settingsRedirect(SETTINGS_PATHS.shippingCarriers)
export const RedirectToPayments = settingsRedirect(SETTINGS_PATHS.payments)
export const RedirectToSeoOrganisation = settingsRedirect("/settings/seo/organisation")
export const RedirectToStoreDetails = settingsRedirect(SETTINGS_PATHS.storeDetails)
