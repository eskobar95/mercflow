import { type ReactNode, useCallback, useMemo } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { Select } from "@/components/ui/Select"
import type { OrderLineItemRow } from "@/features/orders/orderTypes"
import { computePackagingUtilisationPercent } from "@/features/packaging/computePackagingUtilisationPercent"
import { formatPackagingDimensions } from "@/features/packaging/formatPackagingDimensions"
import type { PackagingTypeDto } from "@/features/packaging/packagingTypes"
import { useOrderSuggestedPackaging } from "@/features/packaging/useOrderSuggestedPackaging"

import { OrderSuggestedPackagingWidgetSkeleton } from "./OrderSuggestedPackagingWidgetSkeleton"

type OrderSuggestedPackagingWidgetProps = {
  lineItems: OrderLineItemRow[]
  onConfirmedPackagingChange: (packagingTypeId: string | null) => void
}

function buildCatalogOptions(
  catalog: PackagingTypeDto[],
): Array<{ value: string; label: string }> {
  return catalog.map((row) => ({
    value: row.id,
    label: `${row.name} (${formatPackagingDimensions(row)})`,
  }))
}

export function OrderSuggestedPackagingWidget({
  lineItems,
  onConfirmedPackagingChange,
}: OrderSuggestedPackagingWidgetProps): ReactNode {
  const model = useOrderSuggestedPackaging({ lineItems, onConfirmedPackagingChange })
  const {
    loadState,
    errorMessage,
    suggestion,
    selectedPackaging,
    isOverrideOpen,
    catalogLoadState,
    catalogErrorMessage,
    activeCatalog,
    canSuggest,
    openOverride,
    closeOverride,
    selectPackaging,
    retry,
  } = model

  const catalogOptions = useMemo(() => buildCatalogOptions(activeCatalog), [activeCatalog])

  const handleSelectChange = useCallback(
    (value: string): void => {
      selectPackaging(value)
    },
    [selectPackaging],
  )

  return (
    <section
      aria-label="Suggested packaging"
      className="rounded-lg border border-border-subtle bg-surface-default px-4 py-4 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-content-primary">Suggested packaging</h3>
          <p className="mt-1 text-xs text-content-secondary">
            Based on line item dimensions and your packaging catalog.
          </p>
        </div>
        {loadState === "ready" && (selectedPackaging !== null || canSuggest) ? (
          <Button type="button" variant="secondary" size="sm" onClick={openOverride}>
            Change
          </Button>
        ) : null}
      </div>

      {!canSuggest ? (
        <p className="mt-4 text-sm text-content-secondary">
          Add variant IDs to line items before packaging can be suggested.
        </p>
      ) : null}

      {canSuggest && loadState === "loading" ? (
        <div className="mt-4">
          <OrderSuggestedPackagingWidgetSkeleton />
        </div>
      ) : null}

      {canSuggest && loadState === "error" ? (
        <div
          className="mt-4 rounded-md border border-feedback-danger-border bg-feedback-danger-subtle px-3 py-2 text-sm text-feedback-danger-content"
          role="alert"
        >
          <p>{errorMessage ?? "Failed to load packaging suggestion."}</p>
          <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={retry}>
            Retry
          </Button>
        </div>
      ) : null}

      {canSuggest && loadState === "ready" && suggestion !== null && selectedPackaging === null ? (
        <p className="mt-4 text-sm text-content-secondary">
          No packaging type fits this order.{" "}
          <Link
            to="/settings/packaging"
            className="font-medium text-interactive-primary hover:text-interactive-primary-hover"
          >
            Add or adjust types in Settings → Packaging
          </Link>
          .
        </p>
      ) : null}

      {canSuggest && loadState === "ready" && selectedPackaging !== null && suggestion !== null ? (
        <div className="mt-4 space-y-1 text-sm text-content-primary">
          <p className="font-medium">{selectedPackaging.name}</p>
          <p className="text-content-secondary">
            {formatPackagingDimensions(selectedPackaging)}
          </p>
          <p className="text-content-secondary">
            Utilisation{" "}
            <span className="font-medium tabular-nums text-content-primary">
              {computePackagingUtilisationPercent(
                suggestion.total_volume_mm3,
                selectedPackaging,
              )}
              %
            </span>
          </p>
        </div>
      ) : null}

      {isOverrideOpen ? (
        <div className="mt-4 space-y-2">
          {catalogLoadState === "loading" ? (
            <OrderSuggestedPackagingWidgetSkeleton />
          ) : null}
          {catalogLoadState === "error" ? (
            <p className="text-sm text-feedback-danger-content" role="alert">
              {catalogErrorMessage ?? "Failed to load packaging catalog."}
            </p>
          ) : null}
          {catalogLoadState === "ready" && activeCatalog.length === 0 ? (
            <p className="text-sm text-content-secondary">
              No active packaging types yet.{" "}
              <Link
                to="/settings/packaging"
                className="font-medium text-interactive-primary hover:text-interactive-primary-hover"
              >
                Create one in Settings → Packaging
              </Link>
              .
            </p>
          ) : null}
          {catalogLoadState === "ready" && activeCatalog.length > 0 ? (
            <Select
              aria-label="Packaging type override"
              value={selectedPackaging?.id ?? undefined}
              placeholder="Select packaging type…"
              options={catalogOptions}
              onValueChange={handleSelectChange}
            />
          ) : null}
          <Button type="button" variant="ghost" size="sm" onClick={closeOverride}>
            Cancel
          </Button>
        </div>
      ) : null}
    </section>
  )
}
