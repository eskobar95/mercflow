import type { ReactNode } from "react"
import { ShipmondoConnectorWorkspace } from "@/components/connectors/shipmondo/ShipmondoConnectorWorkspace"

/**
 * Shipmondo connector workspace — credentials, activation, probes, and observability.
 */
export function ShipmondoConnectorSettingsPage(): ReactNode {
  return <ShipmondoConnectorWorkspace />
}
