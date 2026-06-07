import type { ShipmondoCarrierProductDto } from "@/features/connectors/shipmondoTypes"
import { getCurrencyFormatter } from "@/utils/intlFormatCache"

export type ShipmondoRulesUiState = {
  markupMinorDraft: number
  freeShippingDraftText: string
  catalogRows: ShipmondoCarrierProductDto[]
  enabledByProductCode: Record<string, boolean>
  catalogError: string | null
  saveError: string | null
  freeShippingParseError: string | null
}

export type ShipmondoRulesUiAction =
  | { type: "syncMarkupFromServer"; value: number }
  | { type: "syncFreeShippingFromServer"; thresholdMinor: number }
  | { type: "syncEnabledFromCatalog"; enabledByProductCode: Record<string, boolean> }
  | { type: "setMarkupMinorDraft"; value: number }
  | { type: "setFreeShippingDraftText"; value: string }
  | { type: "setCatalogRows"; rows: ShipmondoCarrierProductDto[] }
  | { type: "toggleCarrier"; code: string }
  | { type: "setCatalogError"; value: string | null }
  | { type: "setSaveError"; value: string | null }
  | { type: "setFreeShippingParseError"; value: string | null }

const DKK_PRICE_FORMATTER = getCurrencyFormatter("da-DK", "DKK")

export function freeShippingDraftFromMinor(thresholdMinor: number): string {
  return thresholdMinor === 0 ? "" : String(thresholdMinor / 100)
}

export function buildEnabledSelections(
  carriers: ShipmondoCarrierProductDto[],
  allowFromServer: string[],
): Record<string, boolean> {
  const next: Record<string, boolean> = {}
  const whitelistActive = allowFromServer.length > 0
  const allowSet = whitelistActive ? new Set(allowFromServer) : null

  for (const row of carriers) {
    next[row.productCode] = whitelistActive ? (allowSet?.has(row.productCode) ?? false) : true
  }

  return next
}

export function shipmondoRulesUiReducer(
  state: ShipmondoRulesUiState,
  action: ShipmondoRulesUiAction,
): ShipmondoRulesUiState {
  switch (action.type) {
    case "syncMarkupFromServer":
      return { ...state, markupMinorDraft: action.value }
    case "syncFreeShippingFromServer":
      return {
        ...state,
        freeShippingDraftText: freeShippingDraftFromMinor(action.thresholdMinor),
      }
    case "syncEnabledFromCatalog":
      return { ...state, enabledByProductCode: action.enabledByProductCode }
    case "setMarkupMinorDraft":
      return { ...state, markupMinorDraft: action.value }
    case "setFreeShippingDraftText":
      return { ...state, freeShippingDraftText: action.value }
    case "setCatalogRows":
      return { ...state, catalogRows: action.rows }
    case "toggleCarrier":
      return {
        ...state,
        enabledByProductCode: {
          ...state.enabledByProductCode,
          [action.code]: state.enabledByProductCode[action.code] !== true,
        },
      }
    case "setCatalogError":
      return { ...state, catalogError: action.value }
    case "setSaveError":
      return { ...state, saveError: action.value }
    case "setFreeShippingParseError":
      return { ...state, freeShippingParseError: action.value }
    default:
      return state
  }
}

export function formatMinorAsDkk(minorUnits: number): string {
  return DKK_PRICE_FORMATTER.format(minorUnits / 100)
}

export function majorsInputToMinorOrNull(raw: string): number | null {
  const normalized = raw.trim().replace(/\s+/gu, "")
  if (normalized === "") {
    return null
  }
  const n = Number(normalized.replace(",", "."))
  if (!Number.isFinite(n) || n < 0 || n > 999_999) {
    return null
  }
  return Math.round(n * 100)
}
