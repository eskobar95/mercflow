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
  IconWorkspace,
  type IconComponent,
} from "@/components/ui/icons"

/** Canonical settings route paths — single source for nav, breadcrumbs, and redirects. */
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
  /** Legacy paths — redirects handled in router (T077). */
  integrations: "/settings/connectors",
  storeDetails: "/settings/store-details",
  subscriptions: "/settings/subscriptions",
} as const

export type SettingsNavItem = {
  label: string
  path: string
  icon: IconComponent
  /** When true, only an exact path match counts as active. */
  end?: boolean
}

export type SettingsNavGroup = {
  label: string
  icon: IconComponent
  items: SettingsNavItem[]
}

/**
 * Persistent settings sidebar groups — merchant mental model (ADR-012).
 * English labels only; used by SettingsShell and future mobile settings nav.
 */
export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    label: "Store",
    icon: IconSettings,
    items: [
      { label: "General", path: SETTINGS_PATHS.general, icon: IconSettings, end: true },
      { label: "Policies", path: SETTINGS_PATHS.policies, icon: IconWorkspace, end: true },
      { label: "SEO", path: SETTINGS_PATHS.seo, icon: IconGlobals },
    ],
  },
  {
    label: "Sales",
    icon: IconBilling,
    items: [
      { label: "Payments", path: SETTINGS_PATHS.payments, icon: IconBilling, end: true },
      { label: "Taxes", path: SETTINGS_PATHS.taxes, icon: IconBilling, end: true },
      { label: "Checkout", path: SETTINGS_PATHS.checkout, icon: IconBilling, end: true },
    ],
  },
  {
    label: "Shipping",
    icon: IconPackaging,
    items: [
      { label: "Profiles", path: SETTINGS_PATHS.shipping, icon: IconPackaging },
      { label: "Packaging", path: SETTINGS_PATHS.shippingPackaging, icon: IconPackaging, end: true },
      { label: "Carriers", path: SETTINGS_PATHS.shippingCarriers, icon: IconConnectors, end: true },
    ],
  },
  {
    label: "Customers",
    icon: IconCustomers,
    items: [
      {
        label: "Accounts",
        path: SETTINGS_PATHS.customerAccounts,
        icon: IconCustomers,
        end: true,
      },
      { label: "Returns", path: SETTINGS_PATHS.returns, icon: IconCustomers, end: true },
    ],
  },
  {
    label: "Communication",
    icon: IconEmail,
    items: [
      { label: "Email", path: SETTINGS_PATHS.email, icon: IconEmail, end: true },
      {
        label: "Notifications",
        path: SETTINGS_PATHS.notifications,
        icon: IconEmail,
        end: true,
      },
    ],
  },
  {
    label: "Team",
    icon: IconTeam,
    items: [{ label: "Users", path: SETTINGS_PATHS.team, icon: IconTeam, end: true }],
  },
  {
    label: "Apps",
    icon: IconConnectors,
    items: [{ label: "Overview", path: SETTINGS_PATHS.apps, icon: IconConnectors, end: true }],
  },
  {
    label: "Developers",
    icon: IconCustomData,
    items: [
      {
        label: "Custom data",
        path: SETTINGS_PATHS.customData,
        icon: IconCustomData,
        end: true,
      },
    ],
  },
]
