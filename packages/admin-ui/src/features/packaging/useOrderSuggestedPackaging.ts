import { useCallback, useEffect, useMemo, useReducer } from "react"

import { resolveShipmondoLabelBlockReason } from "@/features/orders/resolveShipmondoLabelBlockReason"
import type { OrderLineItemRow } from "@/features/orders/orderTypes"
import {
  fetchActivePackagingTypes,
  suggestPackagingForOrderItems,
} from "@/features/packaging/packagingAdminApi"
import type { PackagingTypeDto, SuggestPackagingResult } from "@/features/packaging/packagingTypes"

export type OrderSuggestedPackagingLoadState = "loading" | "error" | "ready"

type CatalogLoadState = "idle" | "loading" | "error" | "ready"

type SuggestedPackagingState = {
  loadState: OrderSuggestedPackagingLoadState
  errorMessage: string | null
  suggestion: SuggestPackagingResult | null
  selectedPackaging: PackagingTypeDto | null
  isOverrideOpen: boolean
  catalogLoadState: CatalogLoadState
  catalogErrorMessage: string | null
  activeCatalog: PackagingTypeDto[]
  reloadToken: number
}

type SuggestedPackagingAction =
  | { type: "suggestStart" }
  | { type: "suggestSuccess"; suggestion: SuggestPackagingResult }
  | { type: "suggestError"; message: string }
  | { type: "suggestSkipped" }
  | { type: "openOverride" }
  | { type: "closeOverride" }
  | { type: "catalogStart" }
  | { type: "catalogSuccess"; rows: PackagingTypeDto[] }
  | { type: "catalogError"; message: string }
  | { type: "catalogReset" }
  | { type: "selectPackaging"; packaging: PackagingTypeDto }
  | { type: "retry" }

const INITIAL_SUGGESTED_PACKAGING_STATE: SuggestedPackagingState = {
  loadState: "loading",
  errorMessage: null,
  suggestion: null,
  selectedPackaging: null,
  isOverrideOpen: false,
  catalogLoadState: "idle",
  catalogErrorMessage: null,
  activeCatalog: [],
  reloadToken: 0,
}

function suggestedPackagingReducer(
  state: SuggestedPackagingState,
  action: SuggestedPackagingAction,
): SuggestedPackagingState {
  switch (action.type) {
    case "suggestStart":
      return {
        ...state,
        loadState: "loading",
        errorMessage: null,
        suggestion: null,
        selectedPackaging: null,
        isOverrideOpen: false,
        catalogLoadState: "idle",
        catalogErrorMessage: null,
      }
    case "suggestSuccess":
      return {
        ...state,
        loadState: "ready",
        suggestion: action.suggestion,
        selectedPackaging: action.suggestion.suggested,
      }
    case "suggestError":
      return {
        ...state,
        loadState: "error",
        errorMessage: action.message,
      }
    case "suggestSkipped":
      return {
        ...state,
        loadState: "ready",
        errorMessage: null,
        suggestion: null,
        selectedPackaging: null,
        isOverrideOpen: false,
      }
    case "openOverride":
      return { ...state, isOverrideOpen: true }
    case "closeOverride":
      return {
        ...state,
        isOverrideOpen: false,
        catalogLoadState: "idle",
        catalogErrorMessage: null,
      }
    case "catalogStart":
      return {
        ...state,
        catalogLoadState: "loading",
        catalogErrorMessage: null,
      }
    case "catalogSuccess":
      return {
        ...state,
        catalogLoadState: "ready",
        activeCatalog: action.rows,
      }
    case "catalogError":
      return {
        ...state,
        catalogLoadState: "error",
        catalogErrorMessage: action.message,
      }
    case "catalogReset":
      return {
        ...state,
        catalogLoadState: "idle",
        catalogErrorMessage: null,
      }
    case "selectPackaging":
      return {
        ...state,
        selectedPackaging: action.packaging,
        isOverrideOpen: false,
      }
    case "retry":
      return {
        ...state,
        reloadToken: state.reloadToken + 1,
      }
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

function buildSuggestItems(
  lineItems: OrderLineItemRow[],
): Array<{ variant_id: string; quantity: number }> {
  const items: Array<{ variant_id: string; quantity: number }> = []
  for (const row of lineItems) {
    if (row.variantId === null || row.quantity <= 0) {
      continue
    }
    items.push({ variant_id: row.variantId, quantity: row.quantity })
  }
  return items
}

export type OrderSuggestedPackagingModel = {
  loadState: OrderSuggestedPackagingLoadState
  errorMessage: string | null
  suggestion: SuggestPackagingResult | null
  selectedPackaging: PackagingTypeDto | null
  confirmedPackagingId: string | null
  isOverrideOpen: boolean
  catalogLoadState: CatalogLoadState
  catalogErrorMessage: string | null
  activeCatalog: PackagingTypeDto[]
  canSuggest: boolean
  shipmondoLabelBlockReason: string | null
  openOverride: () => void
  closeOverride: () => void
  selectPackaging: (packagingTypeId: string) => void
  retry: () => void
}

export function useOrderSuggestedPackaging(props: {
  lineItems: OrderLineItemRow[]
  onConfirmedPackagingChange: (packagingTypeId: string | null) => void
}): OrderSuggestedPackagingModel {
  const { lineItems, onConfirmedPackagingChange } = props
  const suggestItems = useMemo(() => buildSuggestItems(lineItems), [lineItems])
  const canSuggest = suggestItems.length > 0
  const suggestItemsKey = useMemo(() => JSON.stringify(suggestItems), [suggestItems])

  const [state, dispatch] = useReducer(
    suggestedPackagingReducer,
    INITIAL_SUGGESTED_PACKAGING_STATE,
  )

  const confirmedPackagingId = state.selectedPackaging?.id ?? null

  useEffect(() => {
    onConfirmedPackagingChange(confirmedPackagingId)
  }, [confirmedPackagingId, onConfirmedPackagingChange])

  useEffect(() => {
    if (!canSuggest) {
      dispatch({ type: "suggestSkipped" })
      return
    }

    let cancelled = false
    const run = async (): Promise<void> => {
      dispatch({ type: "suggestStart" })
      try {
        const result = await suggestPackagingForOrderItems(suggestItems)
        if (!cancelled) {
          dispatch({ type: "suggestSuccess", suggestion: result })
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Failed to suggest packaging"
          dispatch({ type: "suggestError", message: msg })
        }
      }
    }
    void run()
    return (): void => {
      cancelled = true
    }
  }, [canSuggest, suggestItemsKey, state.reloadToken, suggestItems])

  useEffect(() => {
    if (!state.isOverrideOpen || state.catalogLoadState !== "idle") {
      return
    }

    let cancelled = false
    const run = async (): Promise<void> => {
      dispatch({ type: "catalogStart" })
      try {
        const rows = await fetchActivePackagingTypes()
        if (!cancelled) {
          dispatch({ type: "catalogSuccess", rows })
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Failed to load packaging types"
          dispatch({ type: "catalogError", message: msg })
        }
      }
    }
    void run()
    return (): void => {
      cancelled = true
    }
  }, [state.catalogLoadState, state.isOverrideOpen])

  const openOverride = useCallback((): void => {
    dispatch({ type: "openOverride" })
  }, [])

  const closeOverride = useCallback((): void => {
    dispatch({ type: "closeOverride" })
  }, [])

  const selectPackaging = useCallback(
    (packagingTypeId: string): void => {
      const fromSuggestion =
        state.suggestion?.suggested !== null &&
        state.suggestion?.suggested !== undefined &&
        state.suggestion.suggested.id === packagingTypeId
          ? state.suggestion.suggested
          : null
      if (fromSuggestion !== null) {
        dispatch({ type: "selectPackaging", packaging: fromSuggestion })
        return
      }
      const fromCatalog = state.activeCatalog.find((row) => row.id === packagingTypeId) ?? null
      if (fromCatalog !== null) {
        dispatch({ type: "selectPackaging", packaging: fromCatalog })
      }
    },
    [state.activeCatalog, state.suggestion?.suggested],
  )

  const retry = useCallback((): void => {
    dispatch({ type: "retry" })
  }, [])

  const shipmondoLabelBlockReason = useMemo(
    () =>
      resolveShipmondoLabelBlockReason({
        lineItems,
        packagingLoadState: state.loadState,
        packagingErrorMessage: state.errorMessage,
        suggestion: state.suggestion,
      }),
    [lineItems, state.errorMessage, state.loadState, state.suggestion],
  )

  return {
    loadState: state.loadState,
    errorMessage: state.errorMessage,
    suggestion: state.suggestion,
    selectedPackaging: state.selectedPackaging,
    confirmedPackagingId,
    isOverrideOpen: state.isOverrideOpen,
    catalogLoadState: state.catalogLoadState,
    catalogErrorMessage: state.catalogErrorMessage,
    activeCatalog: state.activeCatalog,
    canSuggest,
    shipmondoLabelBlockReason,
    openOverride,
    closeOverride,
    selectPackaging,
    retry,
  }
}
