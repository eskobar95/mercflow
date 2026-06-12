import { useCallback, useEffect, useReducer } from "react"

import {
  getSubscriptionConfig,
  putSubscriptionConfig,
} from "@/features/subscriptions/subscriptionConfigApi"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import {
  INITIAL_SUBSCRIPTIONS_SETTINGS_STATE,
  subscriptionsSettingsReducer,
} from "./subscriptionsSettingsState"

function parsePositiveNumber(raw: string, label: string): number {
  const value = Number(raw.replace(",", "."))
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number`)
  }
  return value
}

function parseDiscountPct(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === "") {
    return null
  }
  const value = Number(trimmed.replace(",", "."))
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("Fallback discount must be between 0 and 100")
  }
  return value
}

export function useSubscriptionsSettingsPage() {
  const [state, dispatch] = useReducer(
    subscriptionsSettingsReducer,
    INITIAL_SUBSCRIPTIONS_SETTINGS_STATE
  )
  const hasBackend = resolveMedusaAdminBackendUrl() !== null

  const reload = useCallback(async (): Promise<void> => {
    dispatch({ type: "loadStart" })
    try {
      const config = await getSubscriptionConfig()
      if (config === null) {
        throw new TypeError("Subscription config response could not be parsed")
      }
      dispatch({ type: "loadSuccess", config })
    } catch (e) {
      dispatch({
        type: "loadError",
        message: e instanceof Error ? e.message : "Unable to load subscription settings",
      })
    }
  }, [])

  useEffect(() => {
    if (!hasBackend) {
      return
    }
    void reload()
  }, [hasBackend, reload])

  const handleSave = useCallback(async (): Promise<void> => {
    dispatch({ type: "saveStart" })
    try {
      const payload = {
        club_enabled: state.clubEnabled,
        club_name: state.clubEnabled ? state.clubName.trim() : state.clubName.trim() || null,
        club_price_monthly: state.clubEnabled
          ? parsePositiveNumber(state.clubPriceMonthly, "Monthly price")
          : null,
        club_price_annual: state.clubEnabled
          ? parsePositiveNumber(state.clubPriceAnnual, "Annual price")
          : null,
        club_fallback_discount_pct: parseDiscountPct(state.clubFallbackDiscountPct),
      }

      const config = await putSubscriptionConfig(payload)
      if (config === null) {
        throw new TypeError("Save response could not be parsed")
      }

      dispatch({
        type: "saveSuccess",
        config,
        message: "Customer Club settings saved",
      })
    } catch (e) {
      dispatch({ type: "saveFinish" })
      dispatch({
        type: "setMessage",
        message: e instanceof Error ? e.message : "Unable to save subscription settings",
      })
    }
  }, [
    state.clubEnabled,
    state.clubName,
    state.clubPriceMonthly,
    state.clubPriceAnnual,
    state.clubFallbackDiscountPct,
  ])

  const previewMonthly = state.clubPriceMonthly.trim() || "—"
  const previewAnnual = state.clubPriceAnnual.trim() || "—"

  return {
    hasBackend,
    state,
    dispatch,
    reload,
    handleSave,
    previewMonthly,
    previewAnnual,
  }
}
