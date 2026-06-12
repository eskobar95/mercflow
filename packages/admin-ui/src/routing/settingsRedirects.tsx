import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

import { SETTINGS_PATHS } from "@/config/settingsNav"

function settingsRedirect(to: string): () => ReactNode {
  return function SettingsRedirectRoute(): ReactNode {
    return <Navigate to={to} replace />
  }
}

export const RedirectToShippingPackaging = settingsRedirect(SETTINGS_PATHS.shippingPackaging)
export const RedirectToShippingCarriers = settingsRedirect(SETTINGS_PATHS.shippingCarriers)
export const RedirectToPayments = settingsRedirect(SETTINGS_PATHS.payments)
export const RedirectToApps = settingsRedirect(SETTINGS_PATHS.apps)
export const RedirectToSeoOrganisation = settingsRedirect("/settings/seo/organisation")
export const RedirectToGeneral = settingsRedirect(SETTINGS_PATHS.general)
export const RedirectToApps = settingsRedirect(SETTINGS_PATHS.apps)
/** @deprecated Use RedirectToGeneral — store-details merged into General (T077). */
export const RedirectToStoreDetails = RedirectToGeneral
