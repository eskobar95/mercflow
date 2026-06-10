export type ConfirmKind = "capture" | "create_fulfillment" | "mark_shipped"

export type OrderFulfillmentBarState = {
  confirmKind: ConfirmKind | null
  mutationLoading: boolean
  mutationError: string | null
  stockLocationId: string | null
  stockLocationLoading: boolean
  stockLocationError: string | null
  labelLoading: boolean
  labelError: string | null
  labelResult: {
    trackingUrl: string | null
    labelPdfBase64: string | null
    reference: string
  } | null
}

export type OrderFulfillmentBarAction =
  | { type: "openConfirm"; kind: ConfirmKind }
  | { type: "closeDialog" }
  | { type: "mutationStart" }
  | { type: "mutationError"; message: string }
  | { type: "mutationFinish" }
  | { type: "stockLocationStart" }
  | { type: "stockLocationSuccess"; id: string | null; error: string | null }
  | { type: "stockLocationError"; message: string }
  | { type: "stockLocationFinish" }
  | { type: "labelStart" }
  | { type: "labelSuccess"; trackingUrl: string | null; labelPdfBase64: string | null; reference: string }
  | { type: "labelError"; message: string }
  | { type: "labelFinish" }

export const INITIAL_ORDER_FULFILLMENT_BAR_STATE: OrderFulfillmentBarState = {
  confirmKind: null,
  mutationLoading: false,
  mutationError: null,
  stockLocationId: null,
  stockLocationLoading: false,
  stockLocationError: null,
  labelLoading: false,
  labelError: null,
  labelResult: null,
}

export function orderFulfillmentBarReducer(
  state: OrderFulfillmentBarState,
  action: OrderFulfillmentBarAction,
): OrderFulfillmentBarState {
  switch (action.type) {
    case "openConfirm":
      return { ...state, confirmKind: action.kind, mutationError: null }
    case "closeDialog":
      return {
        ...state,
        confirmKind: null,
        stockLocationId: null,
        stockLocationError: null,
        stockLocationLoading: false,
      }
    case "mutationStart":
      return { ...state, mutationError: null, mutationLoading: true }
    case "mutationError":
      return { ...state, mutationError: action.message, mutationLoading: false }
    case "mutationFinish":
      return { ...state, mutationLoading: false }
    case "stockLocationStart":
      return { ...state, stockLocationLoading: true, stockLocationError: null }
    case "stockLocationSuccess":
      return {
        ...state,
        stockLocationId: action.id,
        stockLocationError: action.error,
        stockLocationLoading: false,
      }
    case "stockLocationError":
      return { ...state, stockLocationError: action.message, stockLocationLoading: false }
    case "stockLocationFinish":
      return { ...state, stockLocationLoading: false }
    case "labelStart":
      return { ...state, labelError: null, labelLoading: true }
    case "labelSuccess":
      return {
        ...state,
        labelLoading: false,
        labelResult: {
          trackingUrl: action.trackingUrl,
          labelPdfBase64: action.labelPdfBase64,
          reference: action.reference,
        },
      }
    case "labelError":
      return { ...state, labelError: action.message, labelLoading: false }
    case "labelFinish":
      return { ...state, labelLoading: false }
    default:
      return state
  }
}

export function resolveOrderFulfillmentDialogMeta(confirmKind: ConfirmKind | null): {
  title: string
  description: string
} {
  if (confirmKind === "capture") {
    return {
      title: "Capture payment?",
      description:
        "This captures the authorized or awaiting payment for this order so you can fulfill it. Customers may see the charge finalize depending on their bank.",
    }
  }
  if (confirmKind === "create_fulfillment") {
    return {
      title: "Create fulfillment?",
      description:
        "This registers a fulfillment in Medusa for all remaining quantities on this order, using your default stock location. Inventory reservations apply according to your Medusa configuration.",
    }
  }
  if (confirmKind === "mark_shipped") {
    return {
      title: "Mark as shipped?",
      description:
        "This marks the open fulfillment as shipped in Medusa. Update tracking in Medusa later if your workflow requires carrier references.",
    }
  }
  return { title: "", description: "" }
}
