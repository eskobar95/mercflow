import type { SelectOption } from "@/components/ui/Select"

export type ProductCategoryFormState = {
  name: string
  handle: string
  parentSelectValue: string
  isActive: boolean
  submitting: boolean
  deleting: boolean
  formError: string | null
  statusMessage: string | null
  deleteOpen: boolean
}

export type ProductCategoryFormAction =
  | { type: "setName"; value: string }
  | { type: "setHandle"; value: string }
  | { type: "setParentSelectValue"; value: string }
  | { type: "setIsActive"; value: boolean }
  | { type: "setSubmitting"; value: boolean }
  | { type: "setDeleting"; value: boolean }
  | { type: "setFormError"; value: string | null }
  | { type: "setStatusMessage"; value: string | null }
  | { type: "setDeleteOpen"; value: boolean }
  | {
      type: "seedFromProps"
      payload: {
        name: string
        handle: string
        parentSelectValue: string
        isActive: boolean
      }
    }
  | { type: "beginSubmit" }
  | { type: "submitSuccess"; message: string }
  | { type: "submitError"; message: string }
  | { type: "beginDelete" }
  | { type: "deleteSuccess" }
  | { type: "deleteError"; message: string }

export function productCategoryFormReducer(
  state: ProductCategoryFormState,
  action: ProductCategoryFormAction,
): ProductCategoryFormState {
  switch (action.type) {
    case "setName":
      return { ...state, name: action.value }
    case "setHandle":
      return { ...state, handle: action.value }
    case "setParentSelectValue":
      return { ...state, parentSelectValue: action.value }
    case "setIsActive":
      return { ...state, isActive: action.value }
    case "setSubmitting":
      return { ...state, submitting: action.value }
    case "setDeleting":
      return { ...state, deleting: action.value }
    case "setFormError":
      return { ...state, formError: action.value }
    case "setStatusMessage":
      return { ...state, statusMessage: action.value }
    case "setDeleteOpen":
      return { ...state, deleteOpen: action.value }
    case "seedFromProps":
      return {
        ...state,
        ...action.payload,
        formError: null,
        statusMessage: null,
      }
    case "beginSubmit":
      return { ...state, formError: null, statusMessage: null, submitting: true }
    case "submitSuccess":
      return { ...state, submitting: false, statusMessage: action.message }
    case "submitError":
      return { ...state, submitting: false, formError: action.message }
    case "beginDelete":
      return { ...state, formError: null, deleting: true }
    case "deleteSuccess":
      return { ...state, deleting: false, deleteOpen: false }
    case "deleteError":
      return { ...state, deleting: false, deleteOpen: false, formError: action.message }
    default:
      return state
  }
}

export type ProductCategoryCrudFormProps = {
  mode: "create" | "edit"
  /** Required when `mode` is `edit`. */
  categoryId?: string
  initialName: string
  initialHandle: string
  initialParentCategoryId: string | null
  initialIsActive: boolean
  parentSelectOptions: SelectOption[]
  parentOptionsLoading?: boolean
  parentOptionsError?: string | null
  onReloadParentOptions?: () => Promise<void>
  onCreated?: (category: import("@/features/product-categories/types").AdminProductCategoryParsed) => void
  onUpdated?: (category: import("@/features/product-categories/types").AdminProductCategoryParsed) => void
  onDeleted?: () => void
}
