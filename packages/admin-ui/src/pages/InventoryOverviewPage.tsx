import type { ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"

import { InventoryMovementSheet } from "./InventoryMovementSheet"
import { InventoryOverviewFilters } from "./InventoryOverviewFilters"
import { useInventoryOverviewPage } from "./useInventoryOverviewPage"

export function InventoryOverviewPage(): ReactNode {
  const { hasBackend, state, dispatch, columns, openMovements, saveThreshold } =
    useInventoryOverviewPage()

  const {
    rows,
    count,
    lowStockThreshold,
    thresholdDraft,
    search,
    filter,
    page,
    isLoading,
    listError,
    sort,
    movementVariant,
    movements,
    movementsLoading,
    movementsError,
  } = state

  if (!hasBackend) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">
          Configure <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code>{" "}
          to load inventory overview.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      <InventoryOverviewFilters
        search={search}
        filter={filter}
        thresholdDraft={thresholdDraft}
        lowStockThreshold={lowStockThreshold}
        dispatch={dispatch}
        onSaveThreshold={() => void saveThreshold()}
      />

      {listError ? <p className="text-sm text-status-error">{listError}</p> : null}

      <DataTable
        aria-label="Inventory overview"
        caption="Variant stock and incoming purchase orders"
        columns={columns}
        data={rows}
        getRowId={(row) => row.variant_id}
        sortState={sort}
        onRequestSort={(columnId) => {
          dispatch({ type: "cycleSort", columnId })
        }}
        isLoading={isLoading}
        emptyState={
          <ListEmptyState
            title="No variants"
            description="Adjust search or filters, or add products in Medusa."
          />
        }
        getRowActions={(row) => [
          {
            id: "movements",
            label: "Movement history",
            onSelect: () => openMovements(row),
          },
        ]}
      />

      <p className="text-sm text-content-tertiary">
        Showing {rows.length} of {count} variants (page {page}).
      </p>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page <= 1 || isLoading}
          onClick={() => dispatch({ type: "setPage", page: (p) => Math.max(1, p - 1) })}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={rows.length === 0 || page * 25 >= count || isLoading}
          onClick={() => dispatch({ type: "setPage", page: (p) => p + 1 })}
        >
          Next
        </Button>
      </div>

      <InventoryMovementSheet
        movementVariant={movementVariant}
        movements={movements}
        movementsLoading={movementsLoading}
        movementsError={movementsError}
        dispatch={dispatch}
      />
    </div>
  )
}
