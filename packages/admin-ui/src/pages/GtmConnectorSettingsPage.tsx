import type { ReactNode } from "react"

import { GtmConnectorSettingsForm } from "@/components/connectors/GtmConnectorSettingsForm"
import { PageHeader } from "@/components/ui/PageHeader"
import { CONNECTOR_CATALOG } from "@/features/connectors/connectorsCatalog"

import { settingsConnectorBreadcrumbs } from "@/config/settingsBreadcrumbs"

/**
 * Settings route for configuring the Google Tag Manager container ID consumed by storefront code.
 */
export function GtmConnectorSettingsPage(): ReactNode {
  return (
    <div className="p-6">
      <PageHeader
        title={CONNECTOR_CATALOG.gtm.name}
        description="Configure the Measurement container your storefront exposes to browsers. Updating this value takes effect immediately for new requests to GET /store/connectors/gtm."
        breadcrumbs={settingsConnectorBreadcrumbs(CONNECTOR_CATALOG.gtm.name)}
      />

      <div className="mt-6">
        <GtmConnectorSettingsForm />
      </div>
    </div>
  )
}
