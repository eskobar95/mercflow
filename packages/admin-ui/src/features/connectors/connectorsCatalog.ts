import type { ConnectorSlug } from "./types"

type ConnectorCatalogEntry = {
  /** Short label rendered in connector cards */
  name: string
  /** Neutral one-line explanation for admins */
  description: string
  /** Accessible monogram fallback when no brand asset is wired */
  monogram: string
}

export const CONNECTOR_CATALOG: Record<ConnectorSlug, ConnectorCatalogEntry> = {
  shipmondo: {
    name: "Shipmondo",
    description: "Shipping labels, carriers, and pickup points for outbound orders.",
    monogram: "Sh",
  },
  stripe: {
    name: "Stripe",
    description: "Card payments and payout configuration for storefront checkout.",
    monogram: "St",
  },
  plunk: {
    name: "Plunk",
    description: "Transactional email infrastructure for storefront notifications.",
    monogram: "Pl",
  },
  gtm: {
    name: "Google Tag Manager",
    description: "Tag container for analytics and marketing measurement scripts.",
    monogram: "G",
  },
}
