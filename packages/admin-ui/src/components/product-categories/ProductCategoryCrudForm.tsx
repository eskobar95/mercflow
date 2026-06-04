import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import type { SelectOption } from "@/components/ui/Select"
import { Select } from "@/components/ui/Select"
import { Switch } from "@/components/ui/Switch"
import { parentCategoryIdToSelectValue, selectValueToParentCategoryId } from "@/features/product-categories/buildParentCategorySelectOptions"
import {
  createAdminProductCategory,
  deleteAdminProductCategory,
  updateAdminProductCategory,
} from "@/features/product-categories/productCategoriesAdminApi"
import { slugifyCategoryHandle } from "@/features/product-categories/slugifyCategoryHandle"
import type { AdminProductCategoryParsed } from "@/features/product-categories/types"
import { useSeoSlugStrategy } from "@/hooks/useSeoSlugStrategy"

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
  onCreated?: (category: AdminProductCategoryParsed) => void
  onUpdated?: (category: AdminProductCategoryParsed) => void
  onDeleted?: () => void
}

/**
 * Create / edit product category — Medusa Admin `product_category` fields (name, handle, parent, active) plus delete on edit.
 */
export function ProductCategoryCrudForm({
  mode,
  categoryId,
  initialName,
  initialHandle,
  initialParentCategoryId,
  initialIsActive,
  parentSelectOptions,
  parentOptionsLoading = false,
  parentOptionsError = null,
  onReloadParentOptions,
  onCreated,
  onUpdated,
  onDeleted,
}: ProductCategoryCrudFormProps): JSX.Element {
  const navigate = useNavigate()
  const { strategy: slugStrategy } = useSeoSlugStrategy()
  const [name, setName] = useState(initialName)
  const [handle, setHandle] = useState(initialHandle)
  const [parentSelectValue, setParentSelectValue] = useState<string>(() =>
    parentCategoryIdToSelectValue(initialParentCategoryId)
  )
  const [isActive, setIsActive] = useState(initialIsActive)
  const [handleManuallyEdited, setHandleManuallyEdited] = useState(mode === "edit")
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const resolvedHandle = useMemo((): string => {
    const t = handle.trim()
    if (t !== "") {
      return t
    }
    return slugifyCategoryHandle(name, slugStrategy)
  }, [handle, name, slugStrategy])

  const onNameChange = (next: string): void => {
    setName(next)
    if (!handleManuallyEdited) {
      setHandle(slugifyCategoryHandle(next, slugStrategy))
    }
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setFormError(null)
    setStatusMessage(null)

    const trimmedName = name.trim()
    if (trimmedName === "") {
      setFormError("Name is required.")
      return
    }

    const handleForApi = resolvedHandle.trim()
    if (handleForApi === "") {
      setFormError("Handle is required. Add a handle or a name that can be slugified.")
      return
    }

    const parentId = selectValueToParentCategoryId(parentSelectValue)

    if (mode === "edit" && !categoryId) {
      setFormError("Missing category id.")
      return
    }

    setSubmitting(true)
    try {
      if (mode === "create") {
        const created = await createAdminProductCategory({
          name: trimmedName,
          handle: handleForApi,
          is_active: isActive,
          parent_category_id: parentId,
        })
        setStatusMessage("Category created.")
        onCreated?.(created)
      } else if (categoryId) {
        const updated = await updateAdminProductCategory(categoryId, {
          name: trimmedName,
          handle: handleForApi,
          is_active: isActive,
          parent_category_id: parentId,
        })
        setStatusMessage("Changes saved.")
        onUpdated?.(updated)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed"
      setFormError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const onConfirmDelete = async (): Promise<void> => {
    if (!categoryId) {
      return
    }
    setFormError(null)
    setDeleting(true)
    try {
      await deleteAdminProductCategory(categoryId)
      setDeleteOpen(false)
      onDeleted?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed"
      setFormError(message)
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-content-primary">
        {mode === "create" ? "Category details" : "Edit category"}
      </h2>
      <p className="mt-1 text-sm text-content-secondary">
        Name and handle appear in Admin and the storefront catalog. Nested categories inherit storefront visibility from their ancestors.
      </p>

      {parentOptionsError ? (
        <div
          role="alert"
          className="mt-4 rounded-md border border-border-default bg-surface-subtle p-3 text-sm text-content-secondary"
        >
          <p>{parentOptionsError}</p>
          {onReloadParentOptions ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => {
                void onReloadParentOptions()
              }}
            >
              Retry loading parents
            </Button>
          ) : null}
        </div>
      ) : null}

      {statusMessage ? (
        <p className="mt-4 text-sm text-content-secondary" role="status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}

      <form className="mt-4 space-y-4" onSubmit={(ev) => void onSubmit(ev)} noValidate>
        <FormField label="Name" required>
          <Input
            name="name"
            autoComplete="off"
            value={name}
            onChange={(ev) => {
              onNameChange(ev.target.value)
            }}
            disabled={submitting}
            placeholder="e.g. Outerwear"
          />
        </FormField>

        <FormField
          label="Handle"
          hint="Generated from the name until you edit it. Use lowercase hyphenated slugs."
          required
        >
          <Input
            name="handle"
            autoComplete="off"
            value={handle}
            onChange={(ev) => {
              setHandleManuallyEdited(true)
              setHandle(ev.target.value)
            }}
            disabled={submitting}
            placeholder={slugifyCategoryHandle(name, slugStrategy) || "category-handle"}
          />
        </FormField>

        <div>
          <FormField label="Parent category">
            <Select
              value={parentSelectValue}
              onValueChange={(v): void => {
                setParentSelectValue(v)
              }}
              placeholder="Choose parent…"
              options={parentSelectOptions}
              disabled={
                submitting || parentOptionsLoading || parentSelectOptions.length === 0
              }
              aria-label="Parent category"
            />
          </FormField>
          {parentOptionsLoading ? (
            <p className="mt-1 text-xs text-content-tertiary">
              Loading categories for tree order…
            </p>
          ) : null}
        </div>

        <Switch
          label="Active in storefront"
          checked={isActive}
          onCheckedChange={(v: boolean): void => {
            setIsActive(v)
          }}
          disabled={submitting}
        />

        {formError ? (
          <p className="text-sm text-feedback-danger-content" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button type="submit" variant="primary" disabled={submitting || parentOptionsLoading}>
            {submitting ? "Saving…" : mode === "create" ? "Create category" : "Save changes"}
          </Button>
          {mode === "create" ? (
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => {
                navigate("/product-categories")
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      {mode === "edit" && categoryId ? (
        <div className="mt-8 border-t border-border-subtle pt-6">
          <h3 className="text-base font-semibold text-content-primary">Danger zone</h3>
          <p className="mt-1 text-sm text-content-secondary">
            Delete this category only when it has no linked products or child categories blocking removal. Medusa rejects the delete if constraints fail.
          </p>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="mt-3"
            disabled={submitting || deleting}
            onClick={() => {
              setDeleteOpen(true)
            }}
          >
            Delete category…
          </Button>

          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this category?</AlertDialogTitle>
                <AlertDialogDescription>
                  This cannot be undone. If products are assigned to{" "}
                  <span className="font-medium text-content-primary">{initialName}</span>, Medusa
                  will refuse the deletion — you’ll see the error inline.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleting}
                  onClick={() => {
                    void onConfirmDelete()
                  }}
                >
                  {deleting ? "Deleting…" : "Delete category"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}
    </Card>
  )
}
