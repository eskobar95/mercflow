import { useCallback, useEffect, useReducer } from "react"

import {
  type StripeConnectorDetailDto,
  getStripeConnectorDetail,
  getStripePayments,
  patchStripeConnector,
  postStripeConnectionTest,
  postStripeSyncProducts,
} from "@/features/connectors/stripeConnectorApi"

import {
  INITIAL_STRIPE_CONNECTOR_SETTINGS_STATE,
  stripeConnectorSettingsReducer,
} from "./stripeConnectorSettingsState"

export function useStripeConnectorSettingsPage() {
  const [state, dispatch] = useReducer(
    stripeConnectorSettingsReducer,
    INITIAL_STRIPE_CONNECTOR_SETTINGS_STATE,
  )

  const refreshStripeData = useCallback(async (): Promise<void> => {
    dispatch({ type: "loadStart" })
    try {
      const [detailRaw, pRows] = await Promise.all([
        getStripeConnectorDetail(),
        getStripePayments(20),
      ])
      if (detailRaw === null) {
        throw new TypeError("Stripe connector response could not be parsed.")
      }
      dispatch({ type: "loadSuccess", detail: detailRaw, payments: pRows })
    } catch (e) {
      dispatch({
        type: "loadError",
        message: e instanceof Error ? e.message : "Unable to load Stripe connector.",
      })
    }
  }, [])

  useEffect(() => {
    void refreshStripeData()
  }, [refreshStripeData])

  const handleSaveCredentials = async (): Promise<void> => {
    const sk = state.secretInput.trim()
    const pk = state.publishInput.trim()
    const wh = state.webhookInput.trim()

    if (state.detail?.configured !== true && (sk === "" || pk === "")) {
      dispatch({
        type: "setSaveState",
        saveState: {
          status: "error",
          message: "Provide both Stripe secret and publishable keys for the initial connection.",
        },
      })
      return
    }

    if (sk === "" && pk === "" && wh === "") {
      dispatch({
        type: "setSaveState",
        saveState: {
          status: "error",
          message: "Nothing changed — paste a rotated key before saving.",
        },
      })
      return
    }

    dispatch({ type: "setSaveState", saveState: { status: "working" } })
    try {
      const patch: Parameters<typeof patchStripeConnector>[0] = {}
      if (sk !== "") patch.secret_key = sk
      if (pk !== "") patch.publishable_key = pk
      if (wh !== "") patch.webhook_secret = wh

      const next = await patchStripeConnector(patch)
      dispatch({ type: "setDetail", detail: next })
      dispatch({ type: "clearCredentialInputs" })
      void refreshStripeData()
      dispatch({
        type: "setSaveState",
        saveState: { status: "success", message: "Stripe settings saved securely." },
      })
    } catch (e) {
      dispatch({
        type: "setSaveState",
        saveState: {
          status: "error",
          message: e instanceof Error ? e.message : "Saving credentials failed.",
        },
      })
    }
  }

  const handleTest = async (): Promise<void> => {
    dispatch({ type: "setTestState", testState: { status: "working" } })
    try {
      await postStripeConnectionTest()
      await refreshStripeData()
      dispatch({
        type: "setTestState",
        testState: { status: "success", message: "Stripe accepted the credentials." },
      })
    } catch (e) {
      dispatch({
        type: "setTestState",
        testState: {
          status: "error",
          message: e instanceof Error ? e.message : "Connection test failed.",
        },
      })
    }
  }

  const handleSync = async (): Promise<void> => {
    dispatch({
      type: "setSyncState",
      syncState: {
        status: "working",
        message: "Syncing Medusa products into Stripe via the Admin API …",
      },
    })
    try {
      const result = await postStripeSyncProducts()
      dispatch({ type: "setSyncState", syncState: { status: "success", result } })
      await refreshStripeData()
    } catch (e) {
      dispatch({
        type: "setSyncState",
        syncState: {
          status: "error",
          message:
            e instanceof Error ? e.message : "Synchronization failed — check Stripe + Medusa logs.",
        },
      })
    }
  }

  const handleVatChange = async (value: StripeConnectorDetailDto["vat_mode"]): Promise<void> => {
    if (state.detail?.configured !== true) {
      dispatch({
        type: "setVatError",
        message: "Save Stripe credentials before changing VAT behaviour.",
      })
      return
    }

    dispatch({ type: "vatSaveStart" })

    try {
      const next = await patchStripeConnector({ vat_mode: value })
      dispatch({ type: "setDetail", detail: next })
    } catch (e) {
      dispatch({
        type: "setVatError",
        message: e instanceof Error ? e.message : "Unable to update VAT mode.",
      })
    } finally {
      dispatch({ type: "vatSaveFinish" })
    }
  }

  return {
    state,
    dispatch,
    refreshStripeData,
    handleSaveCredentials,
    handleTest,
    handleSync,
    handleVatChange,
  }
}
