import type { JSONContent } from "@tiptap/core"

import { EMPTY_TIPTAP_DOC } from "@/lib/tiptap"

export const SEO_DESCRIPTION_MAX = 160
export const SEO_TITLE_MAX = 255

export type CategoryContentFormState = {
  descriptionJson: JSONContent
  seoTitle: string
  seoDescription: string
  ogUrl: string
  bannerUrl: string
  validationError: string | null
}

export type CategoryContentFormAction =
  | { type: "setDescriptionJson"; value: JSONContent }
  | { type: "setSeoTitle"; value: string }
  | { type: "setSeoDescription"; value: string }
  | { type: "setOgUrl"; value: string }
  | { type: "setBannerUrl"; value: string }
  | { type: "setValidationError"; value: string | null }
  | { type: "syncFromServer"; payload: CategoryContentFormState }

export const INITIAL_CATEGORY_CONTENT_FORM_STATE: CategoryContentFormState = {
  descriptionJson: EMPTY_TIPTAP_DOC,
  seoTitle: "",
  seoDescription: "",
  ogUrl: "",
  bannerUrl: "",
  validationError: null,
}

export function categoryContentFormReducer(
  state: CategoryContentFormState,
  action: CategoryContentFormAction,
): CategoryContentFormState {
  switch (action.type) {
    case "setDescriptionJson":
      return { ...state, descriptionJson: action.value }
    case "setSeoTitle":
      return { ...state, seoTitle: action.value }
    case "setSeoDescription":
      return { ...state, seoDescription: action.value }
    case "setOgUrl":
      return { ...state, ogUrl: action.value }
    case "setBannerUrl":
      return { ...state, bannerUrl: action.value }
    case "setValidationError":
      return { ...state, validationError: action.value }
    case "syncFromServer":
      return action.payload
    default:
      return state
  }
}

export function localeBadgeLabel(locale: string): string {
  const norm = locale.trim()
  if (norm.length === 0) {
    return "—"
  }
  const sub = norm.split("-")[0]
  return sub?.toUpperCase() ?? norm.toUpperCase()
}
