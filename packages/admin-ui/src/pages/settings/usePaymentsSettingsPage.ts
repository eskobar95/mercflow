import { useCallback, useEffect, useReducer } from "react"

import {
  getPaymentProvider,
  postPaymentProviderMode,
  putPaymentProvider,
  type PaymentProviderDto,
} from "@/features/payments/paymentProvidersApi"
import { getAdminSeoConfig } from "@/features/seo/seoConfigApi"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import {
  INITIAL_PAYMENTS_SETTINGS_STATE,
  paymentsSettingsReducer,
  type CredentialTab,
} from "./paymentsSettingsState"

function buildUpsertPayload(
  tab: CredentialTab,
  state: {
    testSecretInput: string
    testPublishInput: string
    testWebhookInput: string
    liveSecretInput: string
    livePublishInput: string
    liveWebhookInput: string
  }
): Record<string, string | null | undefined> {
  if (tab === "test") {
    return {
      test_secret_key: state.testSecretInput.trim() === "" ? undefined : state.testSecretInput.trim(),
      test_publishable_key:
        state.testPublishInput.trim() === "" ? undefined : state.testPublishInput.trim(),
      test_webhook_secret:
        state.testWebhookInput.trim() === "" ? undefined : state.testWebhookInput.trim(),
    }
  }

  return {
    live_secret_key: state.liveSecretInput.trim() === "" ? undefined : state.liveSecretInput.trim(),
    live_publishable_key:
      state.livePublishInput.trim() === "" ? undefined : state.livePublishInput.trim(),
    live_webhook_secret:
      state.liveWebhookInput.trim() === "" ? undefined : state.liveWebhookInput.trim(),
  }
}

function validateSave(tab: CredentialTab, config: PaymentProviderDto | null, publishInput: string): void {
  const hasExistingSecret =
    tab === "test" ? config?.test_has_secret_key === true : config?.live_has_secret_key === true

  if (publishInput.trim() === "" && !hasExistingSecret) {
    throw new Error("Publishable key is required when setting up credentials for the first time")
  }
}

export function usePaymentsSettingsPage() {
  const [state, dispatch] = useReducer(paymentsSettingsReducer, INITIAL_PAYMENTS_SETTINGS_STATE)
  const hasBackend = resolveMedusaAdminBackendUrl() !== null

  const reload = useCallback(async (): Promise<void> => {
    dispatch({ type: "loadStart" })
    try {
      const [config, seoConfig] = await Promise.all([
        getPaymentProvider(),
        getAdminSeoConfig().catch(() => null),
      ])

      if (config === null) {
        throw new TypeError("Payment provider response could not be parsed")
      }

      dispatch({
        type: "loadSuccess",
        config,
        storefrontUrl: seoConfig?.storefront_url ?? null,
      })
    } catch (e) {
      dispatch({
        type: "loadError",
        message: e instanceof Error ? e.message : "Unable to load payment settings",
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
      const publishInput =
        state.activeTab === "test" ? state.testPublishInput : state.livePublishInput
      validateSave(state.activeTab, state.config, publishInput)

      const payload = buildUpsertPayload(state.activeTab, state)
      const config = await putPaymentProvider(payload)
      if (config === null) {
        throw new TypeError("Payment provider response could not be parsed")
      }

      dispatch({
        type: "saveSuccess",
        config,
        message: `${state.activeTab === "test" ? "Test" : "Live"} credentials saved`,
      })
    } catch (e) {
      dispatch({
        type: "saveError",
        message: e instanceof Error ? e.message : "Unable to save credentials",
      })
    }
  }, [state])

  const handleActivateLiveMode = useCallback(async (): Promise<void> => {
    dispatch({ type: "modeSwitchStart" })
    try {
      const config = await postPaymentProviderMode("live")
      if (config === null) {
        throw new TypeError("Payment provider response could not be parsed")
      }
      if (!config.live_has_secret_key) {
        throw new Error("Save live credentials before activating live mode")
      }
      dispatch({ type: "modeSwitchSuccess", config })
    } catch (e) {
      dispatch({
        type: "modeSwitchError",
        message: e instanceof Error ? e.message : "Unable to activate live mode",
      })
    }
  }, [])

  const handleSwitchToTestMode = useCallback(async (): Promise<void> => {
    dispatch({ type: "modeSwitchStart" })
    try {
      const config = await postPaymentProviderMode("test")
      if (config === null) {
        throw new TypeError("Payment provider response could not be parsed")
      }
      dispatch({ type: "modeSwitchSuccess", config })
    } catch (e) {
      dispatch({
        type: "modeSwitchError",
        message: e instanceof Error ? e.message : "Unable to switch to test mode",
      })
    }
  }, [])

  return {
    hasBackend,
    state,
    dispatch,
    reload,
    handleSave,
    handleActivateLiveMode,
    handleSwitchToTestMode,
  }
}
