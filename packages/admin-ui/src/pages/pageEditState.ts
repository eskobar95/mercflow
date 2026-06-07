import type { CmsPageStatus, CmsPageType } from "@/features/cms-pages/cmsPagesAdminApi"

export const PAGE_TYPES: { value: CmsPageType; label: string }[] = [
  { value: "homepage", label: "Homepage" },
  { value: "landing", label: "Landing" },
  { value: "content", label: "Content" },
]

export type PageEditState = {
  title: string
  slug: string
  pageType: CmsPageType
  status: CmsPageStatus
  blockCount: number | null
  loadError: string | null
  saveError: string | null
  isLoading: boolean
  isSaving: boolean
}

export type PageEditAction =
  | { type: "initNew" }
  | { type: "loadStart" }
  | { type: "loadError"; message: string }
  | { type: "loadSuccess"; payload: Pick<PageEditState, "title" | "slug" | "pageType" | "status" | "blockCount"> }
  | { type: "loadFinish" }
  | { type: "setTitle"; value: string }
  | { type: "setSlug"; value: string }
  | { type: "setPageType"; value: CmsPageType }
  | { type: "setStatus"; value: CmsPageStatus }
  | { type: "saveStart" }
  | { type: "saveError"; message: string }
  | { type: "saveFinish" }
  | { type: "saveSuccess"; payload: Pick<PageEditState, "title" | "slug" | "pageType" | "status" | "blockCount"> }

export function pageEditReducer(state: PageEditState, action: PageEditAction): PageEditState {
  switch (action.type) {
    case "initNew":
      return { ...state, isLoading: false, blockCount: 0 }
    case "loadStart":
      return { ...state, isLoading: true, loadError: null }
    case "loadError":
      return { ...state, loadError: action.message, isLoading: false }
    case "loadSuccess":
      return { ...state, ...action.payload, loadError: null, isLoading: false }
    case "loadFinish":
      return { ...state, isLoading: false }
    case "setTitle":
      return { ...state, title: action.value }
    case "setSlug":
      return { ...state, slug: action.value }
    case "setPageType":
      return { ...state, pageType: action.value }
    case "setStatus":
      return { ...state, status: action.value }
    case "saveStart":
      return { ...state, saveError: null, isSaving: true }
    case "saveError":
      return { ...state, saveError: action.message, isSaving: false }
    case "saveFinish":
      return { ...state, isSaving: false }
    case "saveSuccess":
      return { ...state, ...action.payload, isSaving: false }
    default:
      return state
  }
}
