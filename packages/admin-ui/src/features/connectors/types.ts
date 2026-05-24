/**
 * GET /admin/connectors payload — aligned with @mercflow/connector-module list route.
 */

export type ConnectorAdminSlug =
  | "shipmondo"
  | "stripe"
  | "plunk"
  | "gtm"

export type ConnectorAdminListItem = {
  type: ConnectorAdminSlug
  active: boolean
  lastTestedAt: string | null
  configured: boolean
}

export type ConnectorDisplayMeta = {
  title: string
  description: string
  /** Accessible label for decorative tile mark (mono-line icon slot). */
  mark: string
}
