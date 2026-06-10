import type { OrderLineItemRow } from "@/features/orders/orderTypes"
import type {
  OrderSuggestedPackagingLoadState,
  OrderSuggestedPackagingSaveState,
} from "@/features/packaging/orderSuggestedPackagingTypes"
import type { SuggestPackagingResult } from "@/features/packaging/packagingTypes"

function hasSuggestableLineItems(lineItems: OrderLineItemRow[]): boolean {
  return lineItems.some((row) => row.variantId !== null && row.quantity > 0)
}

/**
 * When non-null, Generate label stays disabled and the reason is shown to the merchant.
 */
export function resolveShipmondoLabelBlockReason(input: {
  lineItems: OrderLineItemRow[]
  packagingLoadState: OrderSuggestedPackagingLoadState
  packagingErrorMessage: string | null
  suggestion: SuggestPackagingResult | null
  saveState: OrderSuggestedPackagingSaveState
}): string | null {
  if (!hasSuggestableLineItems(input.lineItems)) {
    return "Add variant IDs to line items before generating a Shipmondo label."
  }

  if (input.packagingLoadState === "loading") {
    return "Calculating order weight from line items…"
  }

  if (input.saveState === "saving") {
    return "Saving packaging choice…"
  }

  if (input.saveState === "error") {
    return "Fix the packaging save error before generating a label."
  }

  if (input.packagingLoadState === "error") {
    return (
      input.packagingErrorMessage ??
      "Cannot calculate parcel weight — check variant shipping weights on products."
    )
  }

  if (input.packagingLoadState === "ready") {
    const totalWeightG = input.suggestion?.total_weight_g ?? 0
    if (totalWeightG <= 0) {
      return "Parcel weight must be greater than zero — add variant shipping weights on products."
    }
  }

  return null
}
