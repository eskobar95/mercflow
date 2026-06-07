import { useEffect, useMemo, useReducer } from "react"

import { useShipmondoConnectorSettings } from "@/hooks/useShipmondoConnectorSettings"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

import {
  INITIAL_SHIPMONDO_WORKSPACE_STATE,
  shipmondoWorkspaceReducer,
} from "./shipmondoWorkspaceState"

export function useShipmondoConnectorWorkspace() {
  const { data, isLoading, isError, error, patch, test } = useShipmondoConnectorSettings()

  const snapshot = data ?? null
  const [ui, dispatch] = useReducer(
    shipmondoWorkspaceReducer,
    INITIAL_SHIPMONDO_WORKSPACE_STATE,
  )

  useAdjustStateWhenKeyChanges(
    snapshot === null ? null : `${snapshot.active}`,
    () => {
      if (snapshot !== null) {
        dispatch({ type: "syncActiveFromServer", active: snapshot.active })
      }
    },
  )

  const configured = useMemo(() => {
    if (snapshot === null) {
      return false
    }
    return (
      snapshot.credentials.apiUserConfigured &&
      snapshot.credentials.apiKeyConfigured
    )
  }, [snapshot])

  useEffect(() => {
    if (test.isSuccess && test.data) {
      const result = test.data
      if (result.success) {
        dispatch({
          type: "setTestBanner",
          value: {
            tone: "success",
            message: result.message ?? "Connection succeeded",
          },
        })
      } else {
        dispatch({
          type: "setTestBanner",
          value: {
            tone: "danger",
            message: result.error ?? "Connection failed",
          },
        })
      }
    }
  }, [test.isSuccess, test.data])

  useEffect(() => {
    if (test.isIdle) {
      return
    }
    if (test.isPending) {
      dispatch({ type: "setTestBanner", value: null })
    }
  }, [test.isPending, test.isIdle])

  const buildPatchBody = (): Record<string, unknown> | null => {
    if (snapshot === null) {
      return null
    }

    const body: Record<string, unknown> = {}

    const nextUser = ui.draftApiUser.trim()
    const nextKey = ui.draftApiKey.trim()
    const nextModuleKey = ui.draftModuleKey.trim()

    if (!configured) {
      if (nextUser.length === 0 || nextKey.length === 0) {
        dispatch({
          type: "setFormError",
          value: "Provide both the API user and API key before saving for the first time.",
        })
        return null
      }
    }

    if (nextUser.length > 0) {
      body.api_user = nextUser
    }
    if (nextKey.length > 0) {
      body.api_key = nextKey
    }

    if (
      snapshot.credentials.shippingModuleKeyConfigured &&
      nextModuleKey.length === 0
    ) {
      body.shipping_module_key = ""
    }

    if (nextModuleKey.length > 0) {
      body.shipping_module_key = nextModuleKey
    }

    body.active = ui.draftActive

    return body
  }

  const handleSave = (): void => {
    dispatch({ type: "setFormError", value: null })
    const body = buildPatchBody()
    if (body === null) {
      return
    }

    patch.mutate(body, {
      onSuccess: () => {
        dispatch({ type: "clearCredentialDrafts" })
      },
      onError: (e: Error) => {
        dispatch({ type: "setFormError", value: e.message })
      },
    })
  }

  const handleTest = (): void => {
    dispatch({ type: "setFormError", value: null })
    dispatch({ type: "setTestBanner", value: null })
    test.mutate(undefined, {
      onError: (e: Error) => {
        dispatch({ type: "setTestBanner", value: { tone: "danger", message: e.message } })
      },
    })
  }

  return {
    snapshot,
    isLoading,
    isError,
    error,
    patch,
    test,
    configured,
    ui,
    dispatch,
    handleSave,
    handleTest,
  }
}
