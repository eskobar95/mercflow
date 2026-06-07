import type { FormEvent } from "react"
import { useMemo, useReducer, useRef } from "react"

import { parentCategoryIdToSelectValue, selectValueToParentCategoryId } from "@/features/product-categories/buildParentCategorySelectOptions"
import {
  createAdminProductCategory,
  deleteAdminProductCategory,
  updateAdminProductCategory,
} from "@/features/product-categories/productCategoriesAdminApi"
import { slugifyCategoryHandle } from "@/features/product-categories/slugifyCategoryHandle"
import { useSeoSlugStrategy } from "@/hooks/useSeoSlugStrategy"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

import {
  productCategoryFormReducer,
  type ProductCategoryCrudFormProps,
} from "./productCategoryFormState"

export function useProductCategoryCrudForm({
  mode,
  categoryId,
  initialName,
  initialHandle,
  initialParentCategoryId,
  initialIsActive,
  onCreated,
  onUpdated,
  onDeleted,
}: Pick<
  ProductCategoryCrudFormProps,
  | "mode"
  | "categoryId"
  | "initialName"
  | "initialHandle"
  | "initialParentCategoryId"
  | "initialIsActive"
  | "onCreated"
  | "onUpdated"
  | "onDeleted"
>) {
  const { strategy: slugStrategy } = useSeoSlugStrategy()
  const handleManuallyEditedRef = useRef(mode === "edit")
  const [form, dispatch] = useReducer(productCategoryFormReducer, {
    name: initialName,
    handle: initialHandle,
    parentSelectValue: parentCategoryIdToSelectValue(initialParentCategoryId),
    isActive: initialIsActive,
    submitting: false,
    deleting: false,
    formError: null,
    statusMessage: null,
    deleteOpen: false,
  })

  const formSeedKey = `${mode}:${categoryId ?? "new"}:${initialName}:${initialHandle}:${initialParentCategoryId ?? ""}:${initialIsActive}`

  useAdjustStateWhenKeyChanges(formSeedKey, () => {
    handleManuallyEditedRef.current = mode === "edit"
    dispatch({
      type: "seedFromProps",
      payload: {
        name: initialName,
        handle: initialHandle,
        parentSelectValue: parentCategoryIdToSelectValue(initialParentCategoryId),
        isActive: initialIsActive,
      },
    })
  })

  const resolvedHandle = useMemo((): string => {
    const t = form.handle.trim()
    if (t !== "") {
      return t
    }
    return slugifyCategoryHandle(form.name, slugStrategy)
  }, [form.handle, form.name, slugStrategy])

  const onNameChange = (next: string): void => {
    dispatch({ type: "setName", value: next })
    if (!handleManuallyEditedRef.current) {
      dispatch({ type: "setHandle", value: slugifyCategoryHandle(next, slugStrategy) })
    }
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    const trimmedName = form.name.trim()
    if (trimmedName === "") {
      dispatch({ type: "setFormError", value: "Name is required." })
      return
    }

    const handleForApi = resolvedHandle.trim()
    if (handleForApi === "") {
      dispatch({
        type: "setFormError",
        value: "Handle is required. Add a handle or a name that can be slugified.",
      })
      return
    }

    const parentId = selectValueToParentCategoryId(form.parentSelectValue)

    if (mode === "edit" && !categoryId) {
      dispatch({ type: "setFormError", value: "Missing category id." })
      return
    }

    dispatch({ type: "beginSubmit" })
    try {
      if (mode === "create") {
        const created = await createAdminProductCategory({
          name: trimmedName,
          handle: handleForApi,
          is_active: form.isActive,
          parent_category_id: parentId,
        })
        dispatch({ type: "submitSuccess", message: "Category created." })
        onCreated?.(created)
      } else if (categoryId) {
        const updated = await updateAdminProductCategory(categoryId, {
          name: trimmedName,
          handle: handleForApi,
          is_active: form.isActive,
          parent_category_id: parentId,
        })
        dispatch({ type: "submitSuccess", message: "Changes saved." })
        onUpdated?.(updated)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed"
      dispatch({ type: "submitError", message })
    }
  }

  const onConfirmDelete = async (): Promise<void> => {
    if (!categoryId) {
      return
    }
    dispatch({ type: "beginDelete" })
    try {
      await deleteAdminProductCategory(categoryId)
      dispatch({ type: "deleteSuccess" })
      onDeleted?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed"
      dispatch({ type: "deleteError", message })
    }
  }

  return {
    slugStrategy,
    form,
    dispatch,
    handleManuallyEditedRef,
    onNameChange,
    onSubmit,
    onConfirmDelete,
  }
}
