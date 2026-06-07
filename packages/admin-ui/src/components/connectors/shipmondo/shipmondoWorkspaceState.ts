export type ShipmondoWorkspaceState = {
  draftActive: boolean
  draftApiUser: string
  draftApiKey: string
  draftModuleKey: string
  formError: string | null
  testBanner: { tone: "success" | "danger"; message: string } | null
}

export type ShipmondoWorkspaceAction =
  | { type: "syncActiveFromServer"; active: boolean }
  | { type: "setDraftActive"; value: boolean }
  | { type: "setDraftApiUser"; value: string }
  | { type: "setDraftApiKey"; value: string }
  | { type: "setDraftModuleKey"; value: string }
  | { type: "setFormError"; value: string | null }
  | { type: "setTestBanner"; value: { tone: "success" | "danger"; message: string } | null }
  | { type: "clearCredentialDrafts" }

export const INITIAL_SHIPMONDO_WORKSPACE_STATE: ShipmondoWorkspaceState = {
  draftActive: false,
  draftApiUser: "",
  draftApiKey: "",
  draftModuleKey: "",
  formError: null,
  testBanner: null,
}

export function shipmondoWorkspaceReducer(
  state: ShipmondoWorkspaceState,
  action: ShipmondoWorkspaceAction,
): ShipmondoWorkspaceState {
  switch (action.type) {
    case "syncActiveFromServer":
      return { ...state, draftActive: action.active }
    case "setDraftActive":
      return { ...state, draftActive: action.value }
    case "setDraftApiUser":
      return { ...state, draftApiUser: action.value }
    case "setDraftApiKey":
      return { ...state, draftApiKey: action.value }
    case "setDraftModuleKey":
      return { ...state, draftModuleKey: action.value }
    case "setFormError":
      return { ...state, formError: action.value }
    case "setTestBanner":
      return { ...state, testBanner: action.value }
    case "clearCredentialDrafts":
      return { ...state, draftApiUser: "", draftApiKey: "", draftModuleKey: "" }
    default:
      return state
  }
}

const lastTestedAtFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

export function formatLastTestedAt(value: string | null): string {
  if (value === null || value.trim() === "") {
    return "Never tested"
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    return "Never tested"
  }
  return lastTestedAtFormatter.format(d)
}
