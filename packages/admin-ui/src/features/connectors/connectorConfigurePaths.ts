import { SETTINGS_PATHS } from "@/config/settingsNav"

import type { ConnectorSlug } from "./types"

/** Contextual settings routes for each connector (Settings → Apps overview). */
export const CONNECTOR_CONFIGURE_PATHS: Record<ConnectorSlug, string> = {
  stripe: SETTINGS_PATHS.payments,
  shipmondo: SETTINGS_PATHS.shippingCarriers,
  plunk: SETTINGS_PATHS.notifications,
  gtm: "/settings/connectors/gtm",
}

export function resolveConnectorConfigurePath(slug: ConnectorSlug): string {
  return CONNECTOR_CONFIGURE_PATHS[slug]
}
