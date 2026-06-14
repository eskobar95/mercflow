import type { BreadcrumbItem } from "@/components/ui/Breadcrumb"

import { SETTINGS_PATHS } from "@/config/settingsNav"

function settingsRoot(): BreadcrumbItem {
  return { label: "Settings", href: SETTINGS_PATHS.root }
}

export function settingsBreadcrumb(label: string): BreadcrumbItem[] {
  return [settingsRoot(), { label }]
}

export function settingsCustomDataBreadcrumbs(): BreadcrumbItem[] {
  return settingsBreadcrumb("Custom data")
}

export function settingsPackagingBreadcrumbs(): BreadcrumbItem[] {
  return [
    settingsRoot(),
    { label: "Shipping", href: SETTINGS_PATHS.shippingPackaging },
    { label: "Packaging" },
  ]
}

export function settingsWorkspaceBreadcrumbs(): BreadcrumbItem[] {
  return settingsBreadcrumb("Workspace")
}

export function settingsIntegrationsBreadcrumbs(): BreadcrumbItem[] {
  return [settingsRoot(), { label: "Apps", href: SETTINGS_PATHS.apps }]
}

export function settingsAppsBreadcrumbs(): BreadcrumbItem[] {
  return [
    settingsRoot(),
    { label: "Apps", href: SETTINGS_PATHS.apps },
    { label: "Overview" },
  ]
}

export function settingsSeoBreadcrumbs(pageLabel: string): BreadcrumbItem[] {
  return [
    settingsRoot(),
    { label: "SEO", href: SETTINGS_PATHS.seo },
    { label: pageLabel },
  ]
}

export function settingsDevelopersBreadcrumbs(): BreadcrumbItem[] {
  return settingsBreadcrumb("Developers")
}

export function settingsConnectorBreadcrumbs(connectorLabel: string): BreadcrumbItem[] {
  return [
    settingsRoot(),
    { label: "Apps", href: SETTINGS_PATHS.apps },
    { label: connectorLabel },
  ]
}

export function settingsEmailBreadcrumbs(): BreadcrumbItem[] {
  return settingsBreadcrumb("Email")
}

export function settingsSubscriptionsBreadcrumbs(): BreadcrumbItem[] {
  return settingsBreadcrumb("Subscriptions")
}

export function settingsPaymentsBreadcrumbs(): BreadcrumbItem[] {
  return settingsBreadcrumb("Payments")
}

export function settingsTeamBreadcrumbs(): BreadcrumbItem[] {
  return settingsBreadcrumb("Team")
}

export function settingsShippingProfilesBreadcrumbs(): BreadcrumbItem[] {
  return [settingsRoot(), { label: "Shipping", href: SETTINGS_PATHS.shipping }, { label: "Profiles" }]
}

export function settingsShippingCarriersBreadcrumbs(): BreadcrumbItem[] {
  return [settingsRoot(), { label: "Shipping", href: SETTINGS_PATHS.shipping }, { label: "Carriers" }]
}

export function settingsGeneralBreadcrumbs(): BreadcrumbItem[] {
  return settingsBreadcrumb("General")
}

export function settingsTaxesBreadcrumbs(): BreadcrumbItem[] {
  return settingsBreadcrumb("Taxes")
}
