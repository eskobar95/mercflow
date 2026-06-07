import { type ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"

import { ProductCategoryDangerZone } from "./ProductCategoryDangerZone"
import { ProductCategoryFormFields } from "./ProductCategoryFormFields"
import { type ProductCategoryCrudFormProps } from "./productCategoryFormState"
import { useProductCategoryCrudForm } from "./useProductCategoryCrudForm"

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
}: ProductCategoryCrudFormProps): ReactNode {
  const {
    slugStrategy,
    form,
    dispatch,
    handleManuallyEditedRef,
    onNameChange,
    onSubmit,
    onConfirmDelete,
  } = useProductCategoryCrudForm({
    mode,
    categoryId,
    initialName,
    initialHandle,
    initialParentCategoryId,
    initialIsActive,
    onCreated,
    onUpdated,
    onDeleted,
  })

  const {
    name,
    handle,
    parentSelectValue,
    isActive,
    submitting,
    deleting,
    formError,
    statusMessage,
    deleteOpen,
  } = form

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

      <ProductCategoryFormFields
        mode={mode}
        name={name}
        handle={handle}
        parentSelectValue={parentSelectValue}
        isActive={isActive}
        submitting={submitting}
        formError={formError}
        parentSelectOptions={parentSelectOptions}
        parentOptionsLoading={parentOptionsLoading}
        slugStrategy={slugStrategy}
        onNameChange={onNameChange}
        onHandleManualChange={(value) => {
          handleManuallyEditedRef.current = true
          dispatch({ type: "setHandle", value })
        }}
        onParentSelectChange={(value) => {
          dispatch({ type: "setParentSelectValue", value })
        }}
        onIsActiveChange={(value) => {
          dispatch({ type: "setIsActive", value })
        }}
        onSubmit={onSubmit}
      />

      {mode === "edit" && categoryId ? (
        <ProductCategoryDangerZone
          categoryId={categoryId}
          initialName={initialName}
          submitting={submitting}
          deleting={deleting}
          deleteOpen={deleteOpen}
          onDeleteOpenChange={(open) => {
            dispatch({ type: "setDeleteOpen", value: open })
          }}
          onConfirmDelete={onConfirmDelete}
        />
      ) : null}
    </Card>
  )
}

export type { ProductCategoryCrudFormProps }
