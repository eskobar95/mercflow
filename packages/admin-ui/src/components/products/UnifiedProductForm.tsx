import { type ReactNode, type FormEvent, useId } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/Toast"

import {
  UnifiedFormValidationError,
  useUnifiedCatalogProductForm,
} from "@/hooks/products/useUnifiedCatalogProductForm"

import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import { UnifiedProductDetailsSection } from "./UnifiedProductDetailsSection"
import { UnifiedProductPricingSection } from "./UnifiedProductPricingSection"
import { UnifiedProductVariantMatrixSection } from "./UnifiedProductVariantMatrixSection"
import { formatFieldErrorsIntoMessage } from "./unifiedProductFormUtils"

type Props = {
  mode: "create" | "edit"
  productId?: string
}

export function UnifiedProductForm({ mode, productId }: Props): ReactNode {
  const baseId = useId()
  const { toast } = useToast()
  const hasBackend = resolveMedusaAdminBackendUrl() !== null

  const controller = useUnifiedCatalogProductForm({
    mode,
    productId,
    onSuccessfulCreateNavigate: undefined,
  })

  const {
    title,
    description,
    isPublished,
    optionRows,
    variantRowsPreview,
    categories,
    selectedCategoryIds,
    fieldErrors,
    formError,
    isSubmitting,
    isLoadingProductDetail,
    prerequisitesError,
    categoriesError,
    setTitle,
    setDescription,
    setIsPublished,
    toggleCategory,
    addOptionRow,
    updateOptionRow,
    removeOptionRow,
    updateEconomicsRow,
    submit,
  } = controller

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    try {
      await submit()
      toast({
        variant: "success",
        title: mode === "create" ? "Product created" : "Product updated",
        description:
          mode === "create"
            ? "Your product, variants, and stock levels were saved in Medusa."
            : "Changes were saved to Medusa.",
      })
    } catch (errorCandidate: unknown) {
      if (errorCandidate instanceof UnifiedFormValidationError) {
        const detail = formatFieldErrorsIntoMessage(errorCandidate.fieldErrors)
        toast({
          variant: "error",
          title: "Fix the highlighted fields",
          description: detail === "" ? "Validation failed — review the form." : detail,
        })
        return
      }

      if (errorCandidate instanceof Error) {
        toast({
          variant: "error",
          title: "Save failed",
          description: errorCandidate.message,
        })
      }
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/products"
              className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
            >
              ← Products
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-content-primary">
              {mode === "create" ? "Create product" : "Edit product"}
            </h1>
            <p className="mt-2 text-sm text-content-secondary">
              Single scrollable flow: details, variant matrix, then per-variant price and stock for the
              primary stock location.
            </p>
          </div>
        </div>

        {!hasBackend ? (
          <p className="rounded-md border border-border-subtle bg-surface-subtle px-4 py-3 text-sm text-content-secondary">
            Connect <code className="text-xs">VITE_MEDUSA_ADMIN_BACKEND_URL</code> to enable live
            catalogue writes. This form stays visible for layout review.
          </p>
        ) : null}

        {prerequisitesError !== null && prerequisitesError !== undefined ? (
          <p className="rounded-md border border-feedback-danger-border bg-feedback-danger-subtle px-4 py-3 text-sm text-feedback-danger-content">
            {prerequisitesError instanceof Error
              ? prerequisitesError.message
              : "Unable to load Medusa prerequisites."}
          </p>
        ) : null}

        {categoriesError !== null && categoriesError !== undefined ? (
          <p className="rounded-md border border-feedback-danger-border bg-feedback-danger-subtle px-4 py-3 text-sm text-feedback-danger-content">
            {categoriesError instanceof Error
              ? categoriesError.message
              : "Unable to load product categories."}
          </p>
        ) : null}

        {formError !== null ? (
          <p
            className="rounded-md border border-feedback-danger-border bg-feedback-danger-subtle px-4 py-3 text-sm text-feedback-danger-content"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        {mode === "edit" && isLoadingProductDetail ? (
          <p className="text-sm text-content-secondary" role="status">
            Loading product…
          </p>
        ) : null}

        <form className="space-y-8" onSubmit={onSubmit} noValidate>
          <UnifiedProductDetailsSection
            baseId={baseId}
            title={title}
            description={description}
            isPublished={isPublished}
            categories={categories}
            selectedCategoryIds={selectedCategoryIds}
            fieldErrors={fieldErrors}
            setTitle={setTitle}
            setDescription={setDescription}
            setIsPublished={setIsPublished}
            toggleCategory={toggleCategory}
          />

          <UnifiedProductVariantMatrixSection
            baseId={baseId}
            optionRows={optionRows}
            addOptionRow={addOptionRow}
            updateOptionRow={updateOptionRow}
            removeOptionRow={removeOptionRow}
          />

          <UnifiedProductPricingSection
            baseId={baseId}
            variantRowsPreview={variantRowsPreview}
            fieldErrors={fieldErrors}
            updateEconomicsRow={updateEconomicsRow}
          />

          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="primary" disabled={!hasBackend || isSubmitting || isLoadingProductDetail}>
              {mode === "create" ? "Create product" : "Save changes"}
            </Button>
            <Link
              className="inline-flex items-center text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
              to="/products"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
