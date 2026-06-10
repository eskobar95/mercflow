import { useCallback, useEffect, useMemo, useReducer } from "react"

import { resolveShipmondoLabelBlockReason } from "@/features/orders/resolveShipmondoLabelBlockReason"
import type { OrderLineItemRow } from "@/features/orders/orderTypes"
import type {
  OrderSuggestedPackagingLoadState,
  OrderSuggestedPackagingSaveState,
} from "@/features/packaging/orderSuggestedPackagingTypes"
import {
  fetchActivePackagingTypes,
  fetchShipmentPackaging,
  packagingTypeFromShipmentPackaging,
  suggestPackagingForOrderItems,
  upsertShipmentPackaging,
} from "@/features/packaging/packagingAdminApi"
import type { PackagingTypeDto, SuggestPackagingResult } from "@/features/packaging/packagingTypes"

export type { OrderSuggestedPackagingLoadState, OrderSuggestedPackagingSaveState } from "@/features/packaging/orderSuggestedPackagingTypes"

type CatalogLoadState = "idle" | "loading" | "error" | "ready"

type SuggestedPackagingState = {
  loadState: OrderSuggestedPackagingLoadState
  errorMessage: string | null
  suggestion: SuggestPackagingResult | null
  selectedPackaging: PackagingTypeDto | null
  saveState: OrderSuggestedPackagingSaveState
  saveErrorMessage: string | null
  isOverrideOpen: boolean
  catalogLoadState: CatalogLoadState
  catalogErrorMessage: string | null
  activeCatalog: PackagingTypeDto[]
  reloadToken: number
}

type SuggestedPackagingAction =
  | { type: "loadStart" }
  | {
      type: "loadSuccess"
      suggestion: SuggestPackagingResult
      selectedPackaging: PackagingTypeDto | null
    }
  | { type: "loadError"; message: string }
  | { type: "suggestSkipped" }
  | { type: "openOverride" }
  | { type: "closeOverride" }
  | { type: "catalogStart" }
  | { type: "catalogSuccess"; rows: PackagingTypeDto[] }
  | { type: "catalogError"; message: string }
  | { type: "catalogReset" }
  | { type: "selectPackaging"; packaging: PackagingTypeDto }
  | { type: "saveStart" }
  | { type: "saveSuccess"; packaging: PackagingTypeDto }
  | { type: "saveError"; message: string }
  | { type: "retry" }

const INITIAL_SUGGESTED_PACKAGING_STATE: SuggestedPackagingState = {
  loadState: "loading",
  errorMessage: null,
  suggestion: null,
  selectedPackaging: null,
  saveState: "idle",
  saveErrorMessage: null,
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
    case "loadStart":
      return {
        ...state,
        loadState: "loading",
        errorMessage: null,
        suggestion: null,
        selectedPackaging: null,
        saveState: "idle",
        saveErrorMessage: null,
        isOverrideOpen: false,
        catalogLoadState: "idle",
        catalogErrorMessage: null,
      }
    case "loadSuccess":
      return {
        ...state,
        loadState: "ready",
        suggestion: action.suggestion,
        selectedPackaging: action.selectedPackaging,
      }
    case "loadError":
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
        saveState: "idle",
        saveErrorMessage: null,
        isOverrideOpen: false,
      }
    case "openOverride":
      return { ...state, isOverrideOpen: true, saveErrorMessage: null }
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
        saveState: "idle",
        saveErrorMessage: null,
      }
    case "saveStart":
      return {
        ...state,
        saveState: "saving",
        saveErrorMessage: null,
      }
    case "saveSuccess":
      return {
        ...state,
        selectedPackaging: action.packaging,
        isOverrideOpen: false,
        saveState: "idle",
        saveErrorMessage: null,
      }
    case "saveError":
      return {
        ...state,
        saveState: "error",
        saveErrorMessage: action.message,
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

function resolvePackagingSelection(
  packagingTypeId: string,
  suggestion: SuggestPackagingResult | null,
  activeCatalog: PackagingTypeDto[],
): PackagingTypeDto | null {
  if (
    suggestion?.suggested !== null &&
    suggestion?.suggested !== undefined &&
    suggestion.suggested.id === packagingTypeId
  ) {
    return suggestion.suggested
  }
  return activeCatalog.find((row) => row.id === packagingTypeId) ?? null
}

export type OrderSuggestedPackagingModel = {
  loadState: OrderSuggestedPackagingLoadState
  errorMessage: string | null
  suggestion: SuggestPackagingResult | null
  selectedPackaging: PackagingTypeDto | null
  confirmedPackagingId: string | null
  saveState: OrderSuggestedPackagingSaveState
  saveErrorMessage: string | null
  isOverrideOpen: boolean
  catalogLoadState: CatalogLoadState
  catalogErrorMessage: string | null
  activeCatalog: PackagingTypeDto[]
  canSuggest: boolean
  canPersist: boolean
  shipmondoLabelBlockReason: string | null
  openOverride: () => void
  closeOverride: () => void
  selectPackaging: (packagingTypeId: string) => void
  retry: () => void
}

export function useOrderSuggestedPackaging(props: {
  lineItems: OrderLineItemRow[]
  fulfillmentId: string | null
}): OrderSuggestedPackagingModel {
  const { lineItems, fulfillmentId } = props
  const suggestItems = useMemo(() => buildSuggestItems(lineItems), [lineItems])
  const canSuggest = suggestItems.length > 0
  const canPersist = fulfillmentId !== null
  const suggestItemsKey = useMemo(() => JSON.stringify(suggestItems), [suggestItems])
  const fulfillmentKey = fulfillmentId ?? ""

  const [state, dispatch] = useReducer(
    suggestedPackagingReducer,
    INITIAL_SUGGESTED_PACKAGING_STATE,
  )

  const confirmedPackagingId = state.selectedPackaging?.id ?? null

  useEffect(() => {
    if (!canSuggest) {
      dispatch({ type: "suggestSkipped" })
      return
    }

    let cancelled = false
    const run = async (): Promise<void> => {
      dispatch({ type: "loadStart" })
      try {
        const persisted =
          fulfillmentId !== null ? await fetchShipmentPackaging(fulfillmentId) : null
        const result = await suggestPackagingForOrderItems(suggestItems)
        if (cancelled) {
          return
        }

        const selectedFromPersisted =
          persisted !== null ? packagingTypeFromShipmentPackaging(persisted) : null
        const selectedPackaging =
          selectedFromPersisted ?? result.suggested

        dispatch({
          type: "loadSuccess",
          suggestion: result,
          selectedPackaging,
        })

        if (fulfillmentId !== null && persisted === null && result.suggested !== null) {
          dispatch({ type: "saveStart" })
          try {
            const saved = await upsertShipmentPackaging(fulfillmentId, result.suggested.id)
            if (!cancelled) {
              dispatch({
                type: "saveSuccess",
                packaging: packagingTypeFromShipmentPackaging(saved),
              })
            }
          } catch (e) {
            if (!cancelled) {
              const msg = e instanceof Error ? e.message : "Failed to save packaging choice"
              dispatch({ type: "saveError", message: msg })
            }
          }
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Failed to load packaging suggestion"
          dispatch({ type: "loadError", message: msg })
        }
      }
    }
    void run()
    return (): void => {
      cancelled = true
    }
  }, [canSuggest, fulfillmentKey, suggestItemsKey, state.reloadToken, suggestItems, fulfillmentId])

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
      const next = resolvePackagingSelection(
        packagingTypeId,
        state.suggestion,
        state.activeCatalog,
      )
      if (next === null) {
        return
      }

      if (fulfillmentId === null) {
        dispatch({ type: "selectPackaging", packaging: next })
        return
      }

      dispatch({ type: "saveStart" })
      void upsertShipmentPackaging(fulfillmentId, packagingTypeId)
        .then((saved) => {
          dispatch({
            type: "saveSuccess",
            packaging: packagingTypeFromShipmentPackaging(saved),
          })
        })
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : "Failed to save packaging choice"
          dispatch({ type: "saveError", message: msg })
        })
    },
    [fulfillmentId, state.activeCatalog, state.suggestion],
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
        saveState: state.saveState,
      }),
    [lineItems, state.errorMessage, state.loadState, state.saveState, state.suggestion],
  )

  return {
    loadState: state.loadState,
    errorMessage: state.errorMessage,
    suggestion: state.suggestion,
    selectedPackaging: state.selectedPackaging,
    confirmedPackagingId,
    saveState: state.saveState,
    saveErrorMessage: state.saveErrorMessage,
    isOverrideOpen: state.isOverrideOpen,
    catalogLoadState: state.catalogLoadState,
    catalogErrorMessage: state.catalogErrorMessage,
    activeCatalog: state.activeCatalog,
    canSuggest,
    canPersist,
    shipmondoLabelBlockReason,
    openOverride,
    closeOverride,
    selectPackaging,
    retry,
  }
}
