import type { ReactNode } from "react"

import { SettingsPlaceholderPage } from "@/pages/settings/SettingsPlaceholderPage"

type SettingsPlaceholderConfig = {
  title: string
  description: string
}

function createSettingsPlaceholderRoute({
  title,
  description,
}: SettingsPlaceholderConfig): () => ReactNode {
  return function SettingsPlaceholderRoute(): ReactNode {
    return <SettingsPlaceholderPage title={title} description={description} />
  }
}

export const SettingsPoliciesPlaceholderRoute = createSettingsPlaceholderRoute({
  title: "Policies",
  description:
    "Privacy policy, terms of service, refund rules, and other legal pages required for your storefront.",
})

export const SettingsTaxesPlaceholderRoute = createSettingsPlaceholderRoute({
  title: "Taxes",
  description:
    "Tax regions, default rates, and inclusive or exclusive pricing for each market you sell in.",
})

export const SettingsCheckoutPlaceholderRoute = createSettingsPlaceholderRoute({
  title: "Checkout",
  description:
    "Checkout behaviour, customer contact requirements, and order confirmation preferences.",
})

export const SettingsShippingProfilesPlaceholderRoute = createSettingsPlaceholderRoute({
  title: "Shipping profiles",
  description:
    "Shipping zones, rates, and fulfilment rules that determine what customers pay at checkout.",
})

export const SettingsCustomerAccountsPlaceholderRoute = createSettingsPlaceholderRoute({
  title: "Customer accounts",
  description:
    "Account creation, login options, and customer profile fields for your storefront.",
})

export const SettingsReturnsPlaceholderRoute = createSettingsPlaceholderRoute({
  title: "Returns",
  description:
    "Return windows, restocking rules, and customer-facing return policy copy.",
})

export const SettingsNotificationsPlaceholderRoute = createSettingsPlaceholderRoute({
  title: "Notifications",
  description:
    "Operator alerts, customer notification channels, and third-party messaging integrations.",
})
