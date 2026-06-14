import type { AdminShippingOption, AdminShippingProfile } from "@medusajs/types"

import type { ShippingSetupContext } from "@/features/shipping/shippingSettingsApi"

export type ShippingSettingsTab = "profiles" | "rates"
export type ShippingSettingsPhase = "loading" | "ready" | "error"

export type ShippingSettingsState = {
  phase: ShippingSettingsPhase
  message: string | null
  activeTab: ShippingSettingsTab
  profiles: AdminShippingProfile[]
  selectedProfileId: string | null
  rates: AdminShippingOption[]
  ratesLoading: boolean
  setup: ShippingSetupContext | null
  profileSheetOpen: boolean
  profileSheetMode: "create" | "edit"
  editingProfile: AdminShippingProfile | null
  profileSaving: boolean
  profileSheetError: string | null
  rateSheetOpen: boolean
  rateSheetMode: "create" | "edit"
  editingRate: AdminShippingOption | null
  rateSaving: boolean
  rateSheetError: string | null
}

export type ShippingSettingsAction =
  | { type: "reloadStart" }
  | { type: "reloadSuccess"; profiles: AdminShippingProfile[]; setup: ShippingSetupContext | null }
  | { type: "reloadError"; message: string }
  | { type: "setActiveTab"; tab: ShippingSettingsTab }
  | { type: "setSelectedProfileId"; profileId: string | null }
  | { type: "ratesLoadStart" }
  | { type: "ratesLoadSuccess"; rates: AdminShippingOption[] }
  | { type: "ratesLoadError"; message: string }
  | { type: "openCreateProfileSheet" }
  | { type: "openEditProfileSheet"; profile: AdminShippingProfile }
  | { type: "closeProfileSheet" }
  | { type: "profileSaveStart" }
  | { type: "profileSaveFinish" }
  | { type: "profileSaveError"; message: string }
  | { type: "openCreateRateSheet" }
  | { type: "openEditRateSheet"; rate: AdminShippingOption }
  | { type: "closeRateSheet" }
  | { type: "rateSaveStart" }
  | { type: "rateSaveFinish" }
  | { type: "rateSaveError"; message: string }
  | { type: "setMessage"; message: string | null }

export const INITIAL_SHIPPING_SETTINGS_STATE: ShippingSettingsState = {
  phase: "loading",
  message: null,
  activeTab: "profiles",
  profiles: [],
  selectedProfileId: null,
  rates: [],
  ratesLoading: false,
  setup: null,
  profileSheetOpen: false,
  profileSheetMode: "create",
  editingProfile: null,
  profileSaving: false,
  profileSheetError: null,
  rateSheetOpen: false,
  rateSheetMode: "create",
  editingRate: null,
  rateSaving: false,
  rateSheetError: null,
}

export function shippingSettingsReducer(
  state: ShippingSettingsState,
  action: ShippingSettingsAction,
): ShippingSettingsState {
  switch (action.type) {
    case "reloadStart":
      return { ...state, phase: "loading", message: null }
    case "reloadSuccess": {
      const keepSelection =
        state.selectedProfileId === null ||
        action.profiles.some((profile) => profile.id === state.selectedProfileId)
      return {
        ...state,
        phase: "ready",
        profiles: action.profiles,
        setup: action.setup,
        selectedProfileId: keepSelection
          ? state.selectedProfileId ?? action.profiles[0]?.id ?? null
          : action.profiles[0]?.id ?? null,
      }
    }
    case "reloadError":
      return { ...state, phase: "error", message: action.message }
    case "setActiveTab":
      return { ...state, activeTab: action.tab }
    case "setSelectedProfileId":
      return { ...state, selectedProfileId: action.profileId }
    case "ratesLoadStart":
      return { ...state, ratesLoading: true, message: null }
    case "ratesLoadSuccess":
      return { ...state, ratesLoading: false, rates: action.rates }
    case "ratesLoadError":
      return { ...state, ratesLoading: false, message: action.message }
    case "openCreateProfileSheet":
      return { ...state, profileSheetOpen: true, profileSheetMode: "create", editingProfile: null, profileSheetError: null }
    case "openEditProfileSheet":
      return { ...state, profileSheetOpen: true, profileSheetMode: "edit", editingProfile: action.profile, profileSheetError: null }
    case "closeProfileSheet":
      return { ...state, profileSheetOpen: false, editingProfile: null, profileSheetError: null }
    case "profileSaveStart":
      return { ...state, profileSaving: true, profileSheetError: null }
    case "profileSaveFinish":
      return { ...state, profileSaving: false, profileSheetOpen: false, editingProfile: null }
    case "profileSaveError":
      return { ...state, profileSaving: false, profileSheetError: action.message }
    case "openCreateRateSheet":
      return { ...state, rateSheetOpen: true, rateSheetMode: "create", editingRate: null, rateSheetError: null }
    case "openEditRateSheet":
      return { ...state, rateSheetOpen: true, rateSheetMode: "edit", editingRate: action.rate, rateSheetError: null }
    case "closeRateSheet":
      return { ...state, rateSheetOpen: false, editingRate: null, rateSheetError: null }
    case "rateSaveStart":
      return { ...state, rateSaving: true, rateSheetError: null }
    case "rateSaveFinish":
      return { ...state, rateSaving: false, rateSheetOpen: false, editingRate: null }
    case "rateSaveError":
      return { ...state, rateSaving: false, rateSheetError: action.message }
    case "setMessage":
      return { ...state, message: action.message }
    default:
      return state
  }
}
