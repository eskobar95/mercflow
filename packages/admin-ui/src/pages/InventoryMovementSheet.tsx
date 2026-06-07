import type { Dispatch, ReactNode } from "react"

import { Sheet } from "@/components/ui/Sheet"
import type { InventoryMovementDto, InventoryOverviewRowDto } from "@/features/inventory/inventoryOverviewAdminApi"

import type { InventoryOverviewAction } from "./inventoryOverviewState"

type InventoryMovementSheetProps = {
  movementVariant: InventoryOverviewRowDto | null
  movements: InventoryMovementDto[]
  movementsLoading: boolean
  movementsError: string | null
  dispatch: Dispatch<InventoryOverviewAction>
}

export function InventoryMovementSheet({
  movementVariant,
  movements,
  movementsLoading,
  movementsError,
  dispatch,
}: InventoryMovementSheetProps): ReactNode {
  return (
    <Sheet
      open={movementVariant !== null}
      onOpenChange={(open) => {
        if (!open) {
          dispatch({ type: "closeMovements" })
        }
      }}
      title={movementVariant?.title ?? "Movement history"}
      description={
        movementVariant
          ? `SKU ${movementVariant.sku ?? movementVariant.variant_id}`
          : undefined
      }
    >
      {movementsLoading ? (
        <p className="text-sm text-content-secondary">Loading movements…</p>
      ) : null}
      {movementsError ? (
        <p className="text-sm text-status-error">{movementsError}</p>
      ) : null}
      {!movementsLoading && movements.length === 0 ? (
        <p className="text-sm text-content-secondary">
          No MercFlow movements yet. PO receipts appear here after you record a receive.
        </p>
      ) : null}
      <ul className="space-y-3">
        {movements.map((movement) => (
          <li
            key={movement.id}
            className="rounded-md border border-border-default bg-surface-subtle px-3 py-2 text-sm"
          >
            <p className="font-medium text-content-primary">{movement.label}</p>
            <p className="text-content-secondary">
              {movement.source.replace(/_/g, " ")} · +{movement.quantity} ·{" "}
              {new Date(movement.occurred_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
