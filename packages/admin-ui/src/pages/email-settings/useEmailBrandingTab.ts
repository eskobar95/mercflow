import { useCallback, useEffect, useMemo, useReducer } from "react"

import {
  canPreviewEmailBranding,
  hasEmailBrandingFieldErrors,
  validateEmailBrandingForm,
} from "@/features/notifications/emailBrandingValidation"
import {
  getAdminEmailConfig,
  getAdminEmailPreview,
  putAdminEmailBranding,
} from "@/features/notifications/notificationConfigApi"
import {
  type EmailBrandingFieldErrors,
  type EmailBrandingFormValues,
  emailConfigToFormValues,
} from "@/features/notifications/types"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"

type State = {
  phase: "loading" | "ready" | "error"
  message: string | null
  values: EmailBrandingFormValues
  saving: boolean
  saveMessage: string | null
  saveErrorMessage: string | null
  previewHtml: string | null
  previewLoading: boolean
  previewError: string | null
  previewModalOpen: boolean
}

type Action =
  | { type: "loadSuccess"; values: EmailBrandingFormValues }
  | { type: "loadError"; message: string }
  | { type: "setField"; field: keyof EmailBrandingFormValues; value: string }
  | { type: "saveStart" }
  | { type: "saveFinish" }
  | { type: "saveSuccess"; values: EmailBrandingFormValues; message: string }
  | { type: "saveError"; message: string }
  | { type: "previewStart" }
  | { type: "previewFinish" }
  | { type: "previewSuccess"; html: string }
  | { type: "previewError"; message: string }
  | { type: "setPreviewModalOpen"; open: boolean }

const initialValues: EmailBrandingFormValues = {
  logoUrl: "",
  storeName: "",
  brandColor: "#2563EB",
  replyTo: "",
  supportEmail: "",
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loadSuccess":
      return { ...state, phase: "ready", values: action.values, message: null }
    case "loadError":
      return { ...state, phase: "error", message: action.message }
    case "setField":
      return { ...state, values: { ...state.values, [action.field]: action.value }, saveMessage: null, saveErrorMessage: null }
    case "saveStart":
      return { ...state, saving: true, saveErrorMessage: null }
    case "saveFinish":
      return { ...state, saving: false }
    case "saveSuccess":
      return { ...state, values: action.values, saveMessage: action.message, saveErrorMessage: null }
    case "saveError":
      return { ...state, saveErrorMessage: action.message, saveMessage: null }
    case "previewStart":
      return { ...state, previewLoading: true, previewError: null }
    case "previewFinish":
      return { ...state, previewLoading: false }
    case "previewSuccess":
      return { ...state, previewHtml: action.html, previewError: null }
    case "previewError":
      return { ...state, previewError: action.message }
    case "setPreviewModalOpen":
      return { ...state, previewModalOpen: action.open }
    default: {
      const exhaustive: never = action
      return exhaustive
    }
  }
}

export function useEmailBrandingTab() {
  const [state, dispatch] = useReducer(reducer, {
    phase: "loading",
    message: null,
    values: initialValues,
    saving: false,
    saveMessage: null,
    saveErrorMessage: null,
    previewHtml: null,
    previewLoading: false,
    previewError: null,
    previewModalOpen: false,
  })
  const debouncedValues = useDebouncedValue(state.values, 500)

  const reload = useCallback(async (): Promise<void> => {
    try {
      const config = await getAdminEmailConfig()
      dispatch({ type: "loadSuccess", values: emailConfigToFormValues(config) })
    } catch (error) {
      dispatch({ type: "loadError", message: error instanceof Error ? error.message : "Unable to load email branding." })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const refreshPreview = useCallback(async (values: EmailBrandingFormValues): Promise<void> => {
    if (!canPreviewEmailBranding(values)) return
    dispatch({ type: "previewStart" })
    try {
      dispatch({ type: "previewSuccess", html: await getAdminEmailPreview("order-confirmation", values) })
    } catch (error) {
      dispatch({ type: "previewError", message: error instanceof Error ? error.message : "Failed to load preview." })
    } finally {
      dispatch({ type: "previewFinish" })
    }
  }, [])

  useEffect(() => {
    if (state.phase === "ready" && canPreviewEmailBranding(debouncedValues)) {
      void refreshPreview(debouncedValues)
    }
  }, [debouncedValues, refreshPreview, state.phase])

  const fieldErrors = useMemo(
    () => (state.phase === "ready" ? validateEmailBrandingForm(state.values) : {} satisfies EmailBrandingFieldErrors),
    [state.phase, state.values],
  )

  return {
    state: { ...state, fieldErrors },
    setField: (field: keyof EmailBrandingFormValues, value: string) => dispatch({ type: "setField", field, value }),
    reload,
    handleSave: async () => {
      if (hasEmailBrandingFieldErrors(fieldErrors)) {
        dispatch({ type: "saveError", message: "Fix the highlighted fields before saving." })
        return
      }
      dispatch({ type: "saveStart" })
      try {
        const config = await putAdminEmailBranding(state.values)
        const nextValues = emailConfigToFormValues(config)
        dispatch({ type: "saveSuccess", values: nextValues, message: "Email branding saved." })
        await refreshPreview(nextValues)
      } catch (error) {
        dispatch({ type: "saveError", message: error instanceof Error ? error.message : "Unable to save branding." })
      } finally {
        dispatch({ type: "saveFinish" })
      }
    },
    openPreviewModal: () => {
      if (hasEmailBrandingFieldErrors(fieldErrors)) {
        dispatch({ type: "saveError", message: "Fix the highlighted fields before previewing." })
        return
      }
      dispatch({ type: "setPreviewModalOpen", open: true })
      if (state.previewHtml === null) void refreshPreview(state.values)
    },
    closePreviewModal: () => dispatch({ type: "setPreviewModalOpen", open: false }),
    refreshPreview: () => refreshPreview(state.values),
  }
}
