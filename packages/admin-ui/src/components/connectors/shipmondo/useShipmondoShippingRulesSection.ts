import { useReducer } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  getShipmondoCarrierProductsAdmin,
  patchShipmondoShippingRulesAdmin,
} from "@/features/connectors/shipmondoConnectorApi"
import type { ShipmondoShippingRulesDto } from "@/features/connectors/shipmondoTypes"
import { ADMIN_SHIPMONDO_SETTINGS_QUERY_KEY } from "@/hooks/useShipmondoConnectorSettings"
import { useAdjustStateWhenSnapshotChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

import {
  buildEnabledSelections,
  freeShippingDraftFromMinor,
  majorsInputToMinorOrNull,
  shipmondoRulesUiReducer,
} from "./shipmondoRulesUiState"

type UseShipmondoShippingRulesSectionOptions = {
  configured: boolean
  shippingRules: ShipmondoShippingRulesDto
}

export function useShipmondoShippingRulesSection({
  configured,
  shippingRules,
}: UseShipmondoShippingRulesSectionOptions) {
  const queryClient = useQueryClient()

  const [ui, dispatch] = useReducer(shipmondoRulesUiReducer, {
    markupMinorDraft: shippingRules.markupAmountMinor,
    freeShippingDraftText: freeShippingDraftFromMinor(shippingRules.freeShippingThresholdMinor),
    catalogRows: [],
    enabledByProductCode: {},
    catalogError: null,
    saveError: null,
    freeShippingParseError: null,
  })

  useAdjustStateWhenSnapshotChanges([shippingRules.markupAmountMinor], () => {
    dispatch({ type: "syncMarkupFromServer", value: shippingRules.markupAmountMinor })
  })

  useAdjustStateWhenSnapshotChanges([shippingRules.freeShippingThresholdMinor], () => {
    dispatch({
      type: "syncFreeShippingFromServer",
      thresholdMinor: shippingRules.freeShippingThresholdMinor,
    })
  })

  const enabledSyncSignature =
    ui.catalogRows.length === 0
      ? ""
      : `${ui.catalogRows.map((row) => row.productCode).join("\u0001")}\u0002${shippingRules.enabledCarrierCodes.join("\u0001")}`

  useAdjustStateWhenSnapshotChanges(
    [enabledSyncSignature, shippingRules.enabledCarrierCodes],
    () => {
      if (enabledSyncSignature === "") {
        return
      }
      dispatch({
        type: "syncEnabledFromCatalog",
        enabledByProductCode: buildEnabledSelections(
          ui.catalogRows,
          shippingRules.enabledCarrierCodes,
        ),
      })
    },
  )

  const carriersMutation = useMutation({
    mutationFn: async () => await getShipmondoCarrierProductsAdmin({ countryCode: "DK" }),
    onMutate: () => {
      dispatch({ type: "setCatalogError", value: null })
    },
    onSuccess: async (rows) => {
      dispatch({ type: "setCatalogRows", rows })
      await queryClient.invalidateQueries({ queryKey: ADMIN_SHIPMONDO_SETTINGS_QUERY_KEY })
    },
    onError: (reason: unknown) => {
      dispatch({
        type: "setCatalogError",
        value: reason instanceof Error ? reason.message : "Unable to fetch carriers.",
      })
    },
  })

  const saveRulesMutation = useMutation({
    mutationFn: async (payload: ShipmondoShippingRulesDto) =>
      patchShipmondoShippingRulesAdmin(payload),
    onMutate: () => {
      dispatch({ type: "setSaveError", value: null })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_SHIPMONDO_SETTINGS_QUERY_KEY })
    },
    onError: (reason: unknown) => {
      dispatch({
        type: "setSaveError",
        value: reason instanceof Error ? reason.message : "Unable to save shipping rules.",
      })
    },
  })

  const handleSaveRulesClick = (): void => {
    const enabledCarrierCodesPayload: string[] =
      ui.catalogRows.length > 0
        ? ((): string[] => {
            const codes: string[] = []
            for (const row of ui.catalogRows) {
              if (ui.enabledByProductCode[row.productCode]) {
                codes.push(row.productCode)
              }
            }
            return codes
          })()
        : [...shippingRules.enabledCarrierCodes]

    if (ui.catalogRows.length > 0 && enabledCarrierCodesPayload.length === 0) {
      dispatch({ type: "setSaveError", value: "Enable at least one Shipmondo product before saving." })
      return
    }

    let freeMinor = 0

    if (ui.freeShippingDraftText.trim() !== "") {
      const parsed = majorsInputToMinorOrNull(ui.freeShippingDraftText)
      if (parsed === null) {
        dispatch({
          type: "setFreeShippingParseError",
          value: "Use Danish major amounts (for example 499 or 499,95) or leave empty.",
        })
        return
      }

      freeMinor = parsed
      dispatch({ type: "setFreeShippingParseError", value: null })
    } else {
      dispatch({ type: "setFreeShippingParseError", value: null })
    }

    const markup =
      typeof ui.markupMinorDraft === "number" && Number.isFinite(ui.markupMinorDraft)
        ? Math.max(0, Math.trunc(ui.markupMinorDraft))
        : 0

    saveRulesMutation.mutate({
      markupAmountMinor: markup,
      freeShippingThresholdMinor: freeMinor,
      enabledCarrierCodes: enabledCarrierCodesPayload,
    })
  }

  return {
    ui,
    dispatch,
    carriersMutation,
    saveRulesMutation,
    handleSaveRulesClick,
    fetchDisabled: !configured || carriersMutation.isPending,
    saveDisabled: !configured || saveRulesMutation.isPending,
  }
}
