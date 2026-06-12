import {
  IconBilling,
  IconConnectors,
  IconCustomData,
  IconCustomers,
  IconEmail,
  IconGlobals,
  IconPackaging,
  IconSettings,
  IconTeam,
  type IconComponent,
} from "@/components/ui/icons"

/** Canonical settings route paths — single source for nav, redirects, and breadcrumbs. */
export const SETTINGS_PATHS = {
  root: "/settings",
  general: "/settings/general",
  policies: "/settings/policies",
  seo: "/settings/seo",
  payments: "/settings/payments",
  taxes: "/settings/taxes",
  checkout: "/settings/checkout",
  shipping: "/settings/shipping",
  shippingPackaging: "/settings/shipping/packaging",
  shippingCarriers: "/settings/shipping/carriers",
  customerAccounts: "/settings/customer-accounts",
  returns: "/settings/returns",
  email: "/settings/email",
  notifications: "/settings/notifications",
  team: "/settings/team",
  apps: "/settings/apps",
  customData: "/settings/custom-data",
  subscriptions: "/settings/subscriptions",
  /** @deprecated Use SETTINGS_PATHS.apps — removed in T077 redirect. */
  integrations: "/settings/connectors",
  /** @deprecated Merged into Store — removed in T077 redirect. */
  storeDetails: "/settings/store-details",
} as const

export type SettingsNavItem = {
  label: string
  path: string
  icon: IconComponent
}

export type SettingsNavGroup = {
  label: string
  icon: IconComponent
  items: SettingsNavItem[]
}

/**
 * Settings secondary sidebar — grouped merchant-mental-model navigation (ADR-012).
 * English UI labels; paths follow PRD-settings-architecture.md.
 */
export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    label: "Store",
    icon: IconSettings,
    items: [
      { label: "General", path: SETTINGS_PATHS.general, icon: IconSettings },
      { label: "Policies", path: SETTINGS_PATHS.policies, icon: IconGlobals },
      { label: "SEO", path: SETTINGS_PATHS.seo, icon: IconGlobals },
    ],
  },
  {
    label: "Sales",
    icon: IconBilling,
    items: [
      { label: "Payments", path: SETTINGS_PATHS.payments, icon: IconBilling },
      { label: "Taxes", path: SETTINGS_PATHS.taxes, icon: IconBilling },
      { label: "Checkout", path: SETTINGS_PATHS.checkout, icon: IconBilling },
    ],
  },
  {
    label: "Shipping",
    icon: IconPackaging,
    items: [
      { label: "Profiles", path: SETTINGS_PATHS.shipping, icon: IconPackaging },
      { label: "Packaging", path: SETTINGS_PATHS.shippingPackaging, icon: IconPackaging },
      { label: "Carriers", path: SETTINGS_PATHS.shippingCarriers, icon: IconConnectors },
    ],
  },
  {
    label: "Customers",
    icon: IconCustomers,
    items: [
      { label: "Accounts", path: SETTINGS_PATHS.customerAccounts, icon: IconCustomers },
      { label: "Returns", path: SETTINGS_PATHS.returns, icon: IconCustomers },
    ],
  },
  {
    label: "Communication",
    icon: IconEmail,
    items: [
      { label: "Email", path: SETTINGS_PATHS.email, icon: IconEmail },
      { label: "Notifications", path: SETTINGS_PATHS.notifications, icon: IconEmail },
    ],
  },
  {
    label: "Team",
    icon: IconTeam,
    items: [{ label: "Users", path: SETTINGS_PATHS.team, icon: IconTeam }],
  },
  {
    label: "Apps",
    icon: IconConnectors,
    items: [{ label: "Overview", path: SETTINGS_PATHS.apps, icon: IconConnectors }],
  },
  {
    label: "Developers",
    icon: IconCustomData,
    items: [{ label: "Custom data", path: SETTINGS_PATHS.customData, icon: IconCustomData }],
  },
]
