import type {
  StripeConnectorDetailDto,
  StripeConnectorSyncResultDto,
  StripePaymentOverviewDto,
} from "@/features/connectors/stripeConnectorApi"

export type StripeLoadState =
  | { status: "idle" | "loading" }
  | { status: "error"; message: string }
  | { status: "ready" }

export type StripeSaveState =
  | { status: "idle" }
  | { status: "working" }
  | { status: "error"; message: string }
  | { status: "success"; message: string }

export type StripeTestState =
  | { status: "idle" }
  | { status: "working" }
  | { status: "error"; message: string }
  | { status: "success"; message: string }

export type StripeSyncState =
  | { status: "idle" }
  | { status: "working"; message: string }
  | { status: "error"; message: string }
  | { status: "success"; result: StripeConnectorSyncResultDto }

export type StripeConnectorSettingsState = {
  loadState: StripeLoadState
  detail: StripeConnectorDetailDto | null
  payments: StripePaymentOverviewDto[]
  secretInput: string
  publishInput: string
  webhookInput: string
  saveState: StripeSaveState
  testState: StripeTestState
  syncState: StripeSyncState
  vatSaving: boolean
  vatError: string | null
}

export type StripeConnectorSettingsAction =
  | { type: "loadStart" }
  | { type: "loadSuccess"; detail: StripeConnectorDetailDto; payments: StripePaymentOverviewDto[] }
  | { type: "loadError"; message: string }
  | { type: "setDetail"; detail: StripeConnectorDetailDto | null }
  | { type: "setSecretInput"; value: string }
  | { type: "setPublishInput"; value: string }
  | { type: "setWebhookInput"; value: string }
  | { type: "clearCredentialInputs" }
  | { type: "setSaveState"; saveState: StripeSaveState }
  | { type: "setTestState"; testState: StripeTestState }
  | { type: "setSyncState"; syncState: StripeSyncState }
  | { type: "vatSaveStart" }
  | { type: "vatSaveFinish" }
  | { type: "setVatError"; message: string | null }

export const INITIAL_STRIPE_CONNECTOR_SETTINGS_STATE: StripeConnectorSettingsState = {
  loadState: { status: "idle" },
  detail: null,
  payments: [],
  secretInput: "",
  publishInput: "",
  webhookInput: "",
  saveState: { status: "idle" },
  testState: { status: "idle" },
  syncState: { status: "idle" },
  vatSaving: false,
  vatError: null,
}

export function stripeConnectorSettingsReducer(
  state: StripeConnectorSettingsState,
  action: StripeConnectorSettingsAction,
): StripeConnectorSettingsState {
  switch (action.type) {
    case "loadStart":
      return { ...state, loadState: { status: "loading" } }
    case "loadSuccess":
      return {
        ...state,
        detail: action.detail,
        payments: action.payments,
        loadState: { status: "ready" },
      }
    case "loadError":
      return { ...state, loadState: { status: "error", message: action.message } }
    case "setDetail":
      return { ...state, detail: action.detail }
    case "setSecretInput":
      return { ...state, secretInput: action.value }
    case "setPublishInput":
      return { ...state, publishInput: action.value }
    case "setWebhookInput":
      return { ...state, webhookInput: action.value }
    case "clearCredentialInputs":
      return { ...state, secretInput: "", publishInput: "", webhookInput: "" }
    case "setSaveState":
      return { ...state, saveState: action.saveState }
    case "setTestState":
      return { ...state, testState: action.testState }
    case "setSyncState":
      return { ...state, syncState: action.syncState }
    case "vatSaveStart":
      return { ...state, vatSaving: true, vatError: null }
    case "vatSaveFinish":
      return { ...state, vatSaving: false }
    case "setVatError":
      return { ...state, vatError: action.message }
    default:
      return state
  }
}
