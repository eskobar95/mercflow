import type { ReactNode } from "react"
import type { ConnectorListItemDto } from "@/features/connectors/types"

import { ConnectorCard } from "./ConnectorCard"

type ConnectorOverviewGridProps = {
  connectors: ConnectorListItemDto[]
}

/**
 * Responsive grid wrapper for `/settings/connectors`.
 */
export function ConnectorOverviewGrid({
  connectors,
}: ConnectorOverviewGridProps): ReactNode {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {connectors.map((item) => (
        <ConnectorCard key={item.type} item={item} />
      ))}
    </div>
  )
}
