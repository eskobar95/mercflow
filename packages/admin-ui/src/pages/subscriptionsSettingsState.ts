import type { SubscriptionConfigDto } from "@/features/subscriptions/subscriptionConfigApi"

export type SubscriptionsSettingsState = {
  phase: "idle" | "loading" | "ready" | "error"
  message: string | null
  config: SubscriptionConfigDto | null
  clubEnabled: boolean
  clubName: string
  clubPriceMonthly: string
  clubPriceAnnual: string
  clubFallbackDiscountPct: string
  saving: boolean
}

export type SubscriptionsSettingsAction =
  | { type: "loadStart" }
  | { type: "loadSuccess"; config: SubscriptionConfigDto }
  | { type: "loadError"; message: string }
  | { type: "setClubEnabled"; value: boolean }
  | { type: "setClubName"; value: string }
  | { type: "setClubPriceMonthly"; value: string }
  | { type: "setClubPriceAnnual"; value: string }
  | { type: "setClubFallbackDiscountPct"; value: string }
  | { type: "saveStart" }
  | { type: "saveFinish" }
  | { type: "saveSuccess"; config: SubscriptionConfigDto; message: string }
  | { type: "setMessage"; message: string | null }

export const INITIAL_SUBSCRIPTIONS_SETTINGS_STATE: SubscriptionsSettingsState = {
  phase: "idle",
  message: null,
  config: null,
  clubEnabled: false,
  clubName: "",
  clubPriceMonthly: "",
  clubPriceAnnual: "",
  clubFallbackDiscountPct: "10",
  saving: false,
}

function formFromConfig(config: SubscriptionConfigDto): Pick<
  SubscriptionsSettingsState,
  "clubEnabled" | "clubName" | "clubPriceMonthly" | "clubPriceAnnual" | "clubFallbackDiscountPct"
> {
  return {
    clubEnabled: config.club_enabled,
    clubName: config.club_name ?? "",
    clubPriceMonthly: config.club_price_monthly ?? "",
    clubPriceAnnual: config.club_price_annual ?? "",
    clubFallbackDiscountPct: config.club_fallback_discount_pct ?? "10",
  }
}

export function subscriptionsSettingsReducer(
  state: SubscriptionsSettingsState,
  action: SubscriptionsSettingsAction
): SubscriptionsSettingsState {
  switch (action.type) {
    case "loadStart":
      return { ...state, phase: "loading", message: null }
    case "loadSuccess":
      return {
        ...state,
        phase: "ready",
        config: action.config,
        ...formFromConfig(action.config),
      }
    case "loadError":
      return { ...state, phase: "error", message: action.message }
    case "setClubEnabled":
      return { ...state, clubEnabled: action.value }
    case "setClubName":
      return { ...state, clubName: action.value }
    case "setClubPriceMonthly":
      return { ...state, clubPriceMonthly: action.value }
    case "setClubPriceAnnual":
      return { ...state, clubPriceAnnual: action.value }
    case "setClubFallbackDiscountPct":
      return { ...state, clubFallbackDiscountPct: action.value }
    case "saveStart":
      return { ...state, saving: true, message: null }
    case "saveFinish":
      return { ...state, saving: false }
    case "saveSuccess":
      return {
        ...state,
        saving: false,
        config: action.config,
        message: action.message,
        ...formFromConfig(action.config),
      }
    case "setMessage":
      return { ...state, message: action.message }
    default:
      return state
  }
}
