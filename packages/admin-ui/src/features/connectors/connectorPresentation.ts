import type { ConnectorAdminSlug } from "@/features/connectors/types"

import type { ConnectorDisplayMeta } from "./types"

/** Static copy — generic MercFlow; no store-specific integrations. */
const CONNECTOR_DISPLAY: Record<ConnectorAdminSlug, ConnectorDisplayMeta> = {
  shipmondo: {
    title: "Shipmondo",
    description:
      "Compare shipping carriers, print labels, and track parcels from one connection.",
    mark: "Shipmondo",
  },
  stripe: {
    title: "Stripe",
    description:
      "Collect card payments online with PCI-aligned credentials scoped to MercFlow.",
    mark: "Stripe",
  },
  plunk: {
    title: "Plunk",
    description:
      "Trigger transactional emails and workflows when orders and fulfilment events fire.",
    mark: "Plunk",
  },
  gtm: {
    title: "Google Tag Manager",
    description:
      "Expose the storefront container snippets managed by operators without code deploys.",
    mark: "GTM",
  },
}

export function getConnectorPresentation(type: ConnectorAdminSlug): ConnectorDisplayMeta {
  return CONNECTOR_DISPLAY[type]
}

export function parseConnectorSlugParam(raw: string | undefined): ConnectorAdminSlug | null {
  if (raw === undefined) {
    return null
  }

  switch (raw) {
    case "shipmondo":
    case "stripe":
    case "plunk":
    case "gtm":
      return raw
    default:
      return null
  }
}
