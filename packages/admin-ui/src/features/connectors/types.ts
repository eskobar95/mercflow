/** Connector slug keys mirrored by `@mercflow/connector-module` GET /admin/connectors. */
export const CONNECTOR_SLUGS = ["shipmondo", "stripe", "plunk", "gtm"] as const

export type ConnectorSlug = (typeof CONNECTOR_SLUGS)[number]

export type ConnectorConnectionHealthUi = "ok" | "error" | "untested"

export type ConnectorListItemDto = {
  type: ConnectorSlug
  active: boolean
  lastTestedAt: string | null
  configured: boolean
  /**
   * Only set when configured — summarizes the last outbound connectivity probe.
   */
  connectionHealth: ConnectorConnectionHealthUi | null
}

export type ConnectorDisplayStatus = "active" | "inactive" | "unconfigured"

export type GtmConnectorAdminDto = {
  container_id: string | null
}

export function resolveConnectorDisplayStatus(
  item: ConnectorListItemDto
): ConnectorDisplayStatus {
  if (!item.configured) {
    return "unconfigured"
  }
  if (item.active) {
    return "active"
  }
  return "inactive"
}
