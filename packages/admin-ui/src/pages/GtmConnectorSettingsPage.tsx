import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { GtmConnectorSettingsForm } from "@/components/connectors/GtmConnectorSettingsForm"
import { CONNECTOR_CATALOG } from "@/features/connectors/connectorsCatalog"

/**
 * Settings route for configuring the Google Tag Manager container ID consumed by storefront code.
 */
export function GtmConnectorSettingsPage(): ReactNode {
  return (
    <div className="p-6">
      <Link
        to="/settings/connectors"
        className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
      >
        ← Connectors
      </Link>

      <div className="mt-6 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
            Integrations
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-content-primary">
            {CONNECTOR_CATALOG.gtm.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-content-secondary">
            Configure the Measurement container your storefront exposes to browsers. Updating this
            value takes effect immediately for new requests to{' '}
            <code className="text-xs text-content-tertiary">GET /store/connectors/gtm</code>.
          </p>
        </div>

        <GtmConnectorSettingsForm />
      </div>
    </div>
  )
}
