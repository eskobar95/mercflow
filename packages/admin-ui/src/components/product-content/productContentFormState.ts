import type { JSONContent } from "@tiptap/core"

import { EMPTY_TIPTAP_DOC } from "@/lib/tiptap"

export const SEO_DESCRIPTION_MAX = 160
export const SEO_TITLE_MAX = 255

export type ProductContentFormState = {
  descriptionJson: JSONContent
  seoTitle: string
  seoDescription: string
  ogUrl: string
  canonicalUrl: string
  validationError: string | null
}

export type ProductContentFormAction =
  | { type: "setDescriptionJson"; value: JSONContent }
  | { type: "setSeoTitle"; value: string }
  | { type: "setSeoDescription"; value: string }
  | { type: "setOgUrl"; value: string }
  | { type: "setCanonicalUrl"; value: string }
  | { type: "setValidationError"; value: string | null }
  | { type: "syncFromServer"; payload: ProductContentFormState }

export const INITIAL_PRODUCT_CONTENT_FORM_STATE: ProductContentFormState = {
  descriptionJson: EMPTY_TIPTAP_DOC,
  seoTitle: "",
  seoDescription: "",
  ogUrl: "",
  canonicalUrl: "",
  validationError: null,
}

export function productContentFormReducer(
  state: ProductContentFormState,
  action: ProductContentFormAction,
): ProductContentFormState {
  switch (action.type) {
    case "setDescriptionJson":
      return { ...state, descriptionJson: action.value }
    case "setSeoTitle":
      return { ...state, seoTitle: action.value }
    case "setSeoDescription":
      return { ...state, seoDescription: action.value }
    case "setOgUrl":
      return { ...state, ogUrl: action.value }
    case "setCanonicalUrl":
      return { ...state, canonicalUrl: action.value }
    case "setValidationError":
      return { ...state, validationError: action.value }
    case "syncFromServer":
      return action.payload
    default:
      return state
  }
}
