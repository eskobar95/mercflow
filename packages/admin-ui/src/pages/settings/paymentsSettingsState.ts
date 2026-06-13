import type { PaymentMode, PaymentProviderDto } from "@/features/payments/paymentProvidersApi"

export type CredentialTab = PaymentMode

export type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "success"; message: string }
  | { status: "error"; message: string }

export type ModeSwitchState =
  | { status: "idle" }
  | { status: "switching" }
  | { status: "error"; message: string }

export type PaymentsSettingsState = {
  phase: "idle" | "loading" | "ready" | "error"
  message: string | null
  config: PaymentProviderDto | null
  activeTab: CredentialTab
  testSecretInput: string
  testPublishInput: string
  testWebhookInput: string
  liveSecretInput: string
  livePublishInput: string
  liveWebhookInput: string
  saveState: SaveState
  modeDialogOpen: boolean
  modeSwitchState: ModeSwitchState
  storefrontUrl: string | null
}

export const INITIAL_PAYMENTS_SETTINGS_STATE: PaymentsSettingsState = {
  phase: "idle",
  message: null,
  config: null,
  activeTab: "test",
  testSecretInput: "",
  testPublishInput: "",
  testWebhookInput: "",
  liveSecretInput: "",
  livePublishInput: "",
  liveWebhookInput: "",
  saveState: { status: "idle" },
  modeDialogOpen: false,
  modeSwitchState: { status: "idle" },
  storefrontUrl: null,
}

export type PaymentsSettingsAction =
  | { type: "loadStart" }
  | { type: "loadSuccess"; config: PaymentProviderDto; storefrontUrl: string | null }
  | { type: "loadError"; message: string }
  | { type: "setActiveTab"; tab: CredentialTab }
  | { type: "setTestSecretInput"; value: string }
  | { type: "setTestPublishInput"; value: string }
  | { type: "setTestWebhookInput"; value: string }
  | { type: "setLiveSecretInput"; value: string }
  | { type: "setLivePublishInput"; value: string }
  | { type: "setLiveWebhookInput"; value: string }
  | { type: "saveStart" }
  | { type: "saveSuccess"; config: PaymentProviderDto; message: string }
  | { type: "saveError"; message: string }
  | { type: "setModeDialogOpen"; open: boolean }
  | { type: "modeSwitchStart" }
  | { type: "modeSwitchSuccess"; config: PaymentProviderDto }
  | { type: "modeSwitchError"; message: string }

function syncInputsFromConfig(config: PaymentProviderDto): Pick<
  PaymentsSettingsState,
  | "testPublishInput"
  | "livePublishInput"
  | "testSecretInput"
  | "liveSecretInput"
  | "testWebhookInput"
  | "liveWebhookInput"
  | "activeTab"
> {
  return {
    activeTab: config.mode,
    testPublishInput: config.test_publishable_key ?? "",
    livePublishInput: config.live_publishable_key ?? "",
    testSecretInput: "",
    liveSecretInput: "",
    testWebhookInput: "",
    liveWebhookInput: "",
  }
}

export function paymentsSettingsReducer(
  state: PaymentsSettingsState,
  action: PaymentsSettingsAction
): PaymentsSettingsState {
  switch (action.type) {
    case "loadStart":
      return { ...state, phase: "loading", message: null }
    case "loadSuccess":
      return {
        ...state,
        phase: "ready",
        message: null,
        config: action.config,
        storefrontUrl: action.storefrontUrl,
        ...syncInputsFromConfig(action.config),
      }
    case "loadError":
      return { ...state, phase: "error", message: action.message }
    case "setActiveTab":
      return { ...state, activeTab: action.tab }
    case "setTestSecretInput":
      return { ...state, testSecretInput: action.value }
    case "setTestPublishInput":
      return { ...state, testPublishInput: action.value }
    case "setTestWebhookInput":
      return { ...state, testWebhookInput: action.value }
    case "setLiveSecretInput":
      return { ...state, liveSecretInput: action.value }
    case "setLivePublishInput":
      return { ...state, livePublishInput: action.value }
    case "setLiveWebhookInput":
      return { ...state, liveWebhookInput: action.value }
    case "saveStart":
      return { ...state, saveState: { status: "saving" } }
    case "saveSuccess":
      return {
        ...state,
        config: action.config,
        saveState: { status: "success", message: action.message },
        ...syncInputsFromConfig(action.config),
      }
    case "saveError":
      return { ...state, saveState: { status: "error", message: action.message } }
    case "setModeDialogOpen":
      return { ...state, modeDialogOpen: action.open, modeSwitchState: { status: "idle" } }
    case "modeSwitchStart":
      return { ...state, modeSwitchState: { status: "switching" } }
    case "modeSwitchSuccess":
      return {
        ...state,
        config: action.config,
        modeDialogOpen: false,
        modeSwitchState: { status: "idle" },
        ...syncInputsFromConfig(action.config),
      }
    case "modeSwitchError":
      return { ...state, modeSwitchState: { status: "error", message: action.message } }
    default:
      return state
  }
}
