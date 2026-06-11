import {
  IconBilling,
  IconConnectors,
  IconCustomData,
  IconEmail,
  IconGlobals,
  IconPackaging,
  IconSettings,
  IconWorkspace,
  type IconComponent,
} from "@/components/ui/icons"

/** Canonical settings route paths — single source for nav, cards, and redirects. */
export const SETTINGS_PATHS = {
  root: "/settings",
  general: "/settings/general",
  email: "/settings/email",
  shippingPackaging: "/settings/shipping/packaging",
  shippingCarriers: "/settings/shipping/carriers",
  payments: "/settings/payments",
  customData: "/settings/custom-data",
  seo: "/settings/seo",
  integrations: "/settings/connectors",
  storeDetails: "/settings/store-details",
} as const

export type SettingsLandingSection = {
  title: string
  description: string
  to: string
  icon: IconComponent
}

/**
 * Cards on the `/settings` landing page — one per top-level settings domain.
 * Order mirrors the PRD admin-shell navigation hierarchy (J001, J004).
 */
export const SETTINGS_LANDING_SECTIONS: SettingsLandingSection[] = [
  {
    title: "General",
    description: "Store name, currency, timezone, and workspace defaults.",
    to: SETTINGS_PATHS.general,
    icon: IconSettings,
  },
  {
    title: "Email",
    description: "Sending domain, branding, and delivery history.",
    to: SETTINGS_PATHS.email,
    icon: IconEmail,
  },
  {
    title: "Shipping",
    description: "Packaging catalog and carrier integrations for outbound orders.",
    to: SETTINGS_PATHS.shippingPackaging,
    icon: IconPackaging,
  },
  {
    title: "Payments",
    description: "Card payments, Stripe credentials, and payout configuration.",
    to: SETTINGS_PATHS.payments,
    icon: IconBilling,
  },
  {
    title: "Custom data",
    description: "Metafield definitions for products, variants, and categories.",
    to: SETTINGS_PATHS.customData,
    icon: IconCustomData,
  },
  {
    title: "SEO",
    description: "Sitemap, robots.txt, redirects, slugs, and structured data.",
    to: SETTINGS_PATHS.seo,
    icon: IconGlobals,
  },
  {
    title: "Integrations",
    description: "Third-party connectors — GTM, Plunk, Shipmondo, and Stripe.",
    to: SETTINGS_PATHS.integrations,
    icon: IconConnectors,
  },
  {
    title: "Store details",
    description: "Domain, branding, legal pages, and public storefront identity.",
    to: SETTINGS_PATHS.storeDetails,
    icon: IconWorkspace,
  },
]
