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
  MERCHANT_NOTIFICATION_TEMPLATES,
  notificationTemplatePreviewTitle,
  readStoredDisabledTemplates,
  toggleTemplateEnabled,
  writeStoredDisabledTemplates,
  type MerchantNotificationTemplateKey,
} from "@/features/notifications/notificationTemplates"
import {
  type EmailBrandingFieldErrors,
  type EmailBrandingFormValues,
  emailConfigToFormValues,
} from "@/features/notifications/types"

type PreviewState = {
  modalOpen: boolean
  templateKey: MerchantNotificationTemplateKey | null
  html: string | null
  loading: boolean
  error: string | null
}

type State = {
  phase: "loading" | "ready" | "error"
  message: string | null
  storeId: string | null
  values: EmailBrandingFormValues
  disabledTemplates: MerchantNotificationTemplateKey[]
  savingBranding: boolean
  brandingSaveMessage: string | null
  brandingSaveErrorMessage: string | null
  savingTemplates: boolean
  templatesSaveMessage: string | null
  templatesSaveErrorMessage: string | null
  preview: PreviewState
}

type Action =
  | {
      type: "loadSuccess"
      storeId: string
      values: EmailBrandingFormValues
      disabledTemplates: MerchantNotificationTemplateKey[]
    }
  | { type: "loadError"; message: string }
  | { type: "setField"; field: keyof EmailBrandingFormValues; value: string }
  | { type: "setTemplateEnabled"; templateKey: MerchantNotificationTemplateKey; enabled: boolean }
  | { type: "brandingSaveStart" }
  | { type: "brandingSaveFinish" }
  | { type: "brandingSaveSuccess"; values: EmailBrandingFormValues; message: string }
  | { type: "brandingSaveError"; message: string }
  | { type: "templatesSaveStart" }
  | { type: "templatesSaveFinish" }
  | { type: "templatesSaveSuccess"; message: string }
  | { type: "templatesSaveError"; message: string }
  | { type: "previewStart"; templateKey: MerchantNotificationTemplateKey }
  | { type: "previewFinish" }
  | { type: "previewSuccess"; html: string }
  | { type: "previewError"; message: string }
  | { type: "setPreviewModalOpen"; open: boolean; templateKey?: MerchantNotificationTemplateKey }

const initialValues: EmailBrandingFormValues = {
  logoUrl: "",
  storeName: "",
  brandColor: "#2563EB",
  replyTo: "",
  supportEmail: "",
}

const initialPreview: PreviewState = {
  modalOpen: false,
  templateKey: null,
  html: null,
  loading: false,
  error: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loadSuccess":
      return {
        ...state,
        phase: "ready",
        storeId: action.storeId,
        values: action.values,
        disabledTemplates: action.disabledTemplates,
        message: null,
      }
    case "loadError":
      return { ...state, phase: "error", message: action.message }
    case "setField":
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        brandingSaveMessage: null,
        brandingSaveErrorMessage: null,
      }
    case "setTemplateEnabled":
      return {
        ...state,
        disabledTemplates: toggleTemplateEnabled(
          action.templateKey,
          state.disabledTemplates,
          action.enabled,
        ),
        templatesSaveMessage: null,
        templatesSaveErrorMessage: null,
      }
    case "brandingSaveStart":
      return { ...state, savingBranding: true, brandingSaveErrorMessage: null }
    case "brandingSaveFinish":
      return { ...state, savingBranding: false }
    case "brandingSaveSuccess":
      return {
        ...state,
        values: action.values,
        brandingSaveMessage: action.message,
        brandingSaveErrorMessage: null,
      }
    case "brandingSaveError":
      return { ...state, brandingSaveErrorMessage: action.message, brandingSaveMessage: null }
    case "templatesSaveStart":
      return { ...state, savingTemplates: true, templatesSaveErrorMessage: null }
    case "templatesSaveFinish":
      return { ...state, savingTemplates: false }
    case "templatesSaveSuccess":
      return { ...state, templatesSaveMessage: action.message, templatesSaveErrorMessage: null }
    case "templatesSaveError":
      return { ...state, templatesSaveErrorMessage: action.message, templatesSaveMessage: null }
    case "previewStart":
      return {
        ...state,
        preview: {
          ...state.preview,
          modalOpen: true,
          templateKey: action.templateKey,
          loading: true,
          error: null,
        },
      }
    case "previewFinish":
      return { ...state, preview: { ...state.preview, loading: false } }
    case "previewSuccess":
      return {
        ...state,
        preview: { ...state.preview, html: action.html, error: null, loading: false },
      }
    case "previewError":
      return {
        ...state,
        preview: { ...state.preview, error: action.message, loading: false },
      }
    case "setPreviewModalOpen":
      return {
        ...state,
        preview: {
          ...state.preview,
          modalOpen: action.open,
          templateKey: action.open
            ? (action.templateKey ?? state.preview.templateKey)
            : state.preview.templateKey,
        },
      }
    default: {
      const exhaustive: never = action
      return exhaustive
    }
  }
}

export function useNotificationsSettingsPage() {
  const [state, dispatch] = useReducer(reducer, {
    phase: "loading",
    message: null,
    storeId: null,
    values: initialValues,
    disabledTemplates: [],
    savingBranding: false,
    brandingSaveMessage: null,
    brandingSaveErrorMessage: null,
    savingTemplates: false,
    templatesSaveMessage: null,
    templatesSaveErrorMessage: null,
    preview: initialPreview,
  })

  const reload = useCallback(async (): Promise<void> => {
    try {
      const config = await getAdminEmailConfig()
      dispatch({
        type: "loadSuccess",
        storeId: config.store_id,
        values: emailConfigToFormValues(config),
        disabledTemplates: readStoredDisabledTemplates(config.store_id),
      })
    } catch (error) {
      dispatch({
        type: "loadError",
        message: error instanceof Error ? error.message : "Unable to load notification settings.",
      })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const fieldErrors = useMemo(
    (): EmailBrandingFieldErrors =>
      state.phase === "ready" ? validateEmailBrandingForm(state.values) : {},
    [state.phase, state.values],
  )

  const loadPreview = useCallback(
    async (templateKey: MerchantNotificationTemplateKey, values: EmailBrandingFormValues) => {
      if (!canPreviewEmailBranding(values)) {
        dispatch({ type: "previewError", message: "Complete branding fields before previewing." })
        return
      }
      dispatch({ type: "previewStart", templateKey })
      try {
        const html = await getAdminEmailPreview("order-confirmation", values)
        dispatch({ type: "previewSuccess", html })
      } catch (error) {
        dispatch({
          type: "previewError",
          message: error instanceof Error ? error.message : "Failed to load preview.",
        })
      } finally {
        dispatch({ type: "previewFinish" })
      }
    },
    [],
  )

  const previewTitle =
    state.preview.templateKey !== null
      ? notificationTemplatePreviewTitle(state.preview.templateKey)
      : "Email preview"

  return {
    state: {
      ...state,
      fieldErrors,
      templates: MERCHANT_NOTIFICATION_TEMPLATES,
    },
    reload,
    setField: (field: keyof EmailBrandingFormValues, value: string) =>
      dispatch({ type: "setField", field, value }),
    setTemplateEnabled: (templateKey: MerchantNotificationTemplateKey, enabled: boolean) =>
      dispatch({ type: "setTemplateEnabled", templateKey, enabled }),
    handleSaveBranding: async (): Promise<void> => {
      if (hasEmailBrandingFieldErrors(fieldErrors)) {
        dispatch({
          type: "brandingSaveError",
          message: "Fix the highlighted fields before saving.",
        })
        return
      }
      dispatch({ type: "brandingSaveStart" })
      try {
        const config = await putAdminEmailBranding(state.values)
        dispatch({
          type: "brandingSaveSuccess",
          values: emailConfigToFormValues(config),
          message: "Email branding saved.",
        })
      } catch (error) {
        dispatch({
          type: "brandingSaveError",
          message: error instanceof Error ? error.message : "Unable to save branding.",
        })
      } finally {
        dispatch({ type: "brandingSaveFinish" })
      }
    },
    handleSaveTemplates: async (): Promise<void> => {
      if (state.storeId === null) {
        dispatch({ type: "templatesSaveError", message: "Store context is missing." })
        return
      }
      dispatch({ type: "templatesSaveStart" })
      try {
        writeStoredDisabledTemplates(state.storeId, state.disabledTemplates)
        dispatch({ type: "templatesSaveSuccess", message: "Template preferences saved." })
      } catch (error) {
        dispatch({
          type: "templatesSaveError",
          message: error instanceof Error ? error.message : "Unable to save templates.",
        })
      } finally {
        dispatch({ type: "templatesSaveFinish" })
      }
    },
    openPreviewModal: (templateKey: MerchantNotificationTemplateKey): void => {
      if (hasEmailBrandingFieldErrors(fieldErrors)) {
        dispatch({
          type: "brandingSaveError",
          message: "Fix the highlighted fields before previewing.",
        })
        return
      }
      dispatch({ type: "setPreviewModalOpen", open: true, templateKey })
      void loadPreview(templateKey, state.values)
    },
    closePreviewModal: (): void => dispatch({ type: "setPreviewModalOpen", open: false }),
    retryPreview: (): void => {
      if (state.preview.templateKey === null) {
        return
      }
      void loadPreview(state.preview.templateKey, state.values)
    },
    previewTitle,
  }
}
