import { type FormEvent, useId } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Checkbox } from "@/components/ui/Checkbox"
import { FormField } from "@/components/ui/FormField"
import { formErrorClass } from "@/components/ui/formStyles"
import { Input } from "@/components/ui/Input"
import { Switch } from "@/components/ui/Switch"
import { Textarea } from "@/components/ui/Textarea"
import { useToast } from "@/components/ui/Toast"

import {
  UnifiedFormValidationError,
  type UnifiedCatalogProductFormErrors,
  useUnifiedCatalogProductForm,
} from "@/hooks/products/useUnifiedCatalogProductForm"

import {
  PRODUCT_FORM_PRICE_CURRENCY,
  splitOptionValuesCsv,
  type VariantRowModel,
} from "@/lib/products/productOptionMatrix"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

type Props = {
  mode: "create" | "edit"
  productId?: string
}

function summarizeVariantRow(selections: VariantRowModel["selections"]): string {
  const keys = Object.keys(selections).sort((a, b) => a.localeCompare(b))

  const parts = keys.map((dimension) => selections[dimension])
  const joined = parts.join(" · ")

  if (joined.trim() === "") {
    return "Variant"
  }

  return joined
}

function formatFieldErrorsIntoMessage(errors: UnifiedCatalogProductFormErrors): string {
  const parts = Object.values(errors)
  if (parts.length === 0) {
    return ""
  }
  return parts.join(" ")
}

export function UnifiedProductForm({ mode, productId }: Props): JSX.Element {
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

  const titleFieldId = `${baseId}-title`
  const descriptionFieldId = `${baseId}-description`
  const publishFieldId = `${baseId}-publish`

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
          <section aria-labelledby={`${baseId}-step-1`} className="space-y-4">
            <h2 id={`${baseId}-step-1`} className="text-lg font-semibold text-content-primary">
              Step 1 — Details
            </h2>

            <Card elevation="flat" className="space-y-4 p-6">
              <FormField label="Product title" htmlFor={titleFieldId} required error={fieldErrors.title}>
                <Input
                  id={titleFieldId}
                  name="title"
                  type="text"
                  autoComplete="off"
                  required
                  value={title}
                  error={Boolean(fieldErrors.title)}
                  onChange={(e) => {
                    setTitle(e.target.value)
                  }}
                  aria-invalid={Boolean(fieldErrors.title)}
                />
              </FormField>

              <FormField
                label="Description"
                htmlFor={descriptionFieldId}
                hint="Plain text until the Sprint 3 content tab replaces this field."
              >
                <Textarea
                  id={descriptionFieldId}
                  name="description"
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                  }}
                />
              </FormField>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-content-primary">Visibility</p>
                  <p className="text-xs text-content-tertiary">
                    Toggle between draft mode and storefront-ready published products.
                  </p>
                </div>
                <Switch
                  id={publishFieldId}
                  checked={isPublished}
                  onCheckedChange={(checked) => {
                    setIsPublished(checked === true)
                  }}
                  label={isPublished ? "Published" : "Draft"}
                />
              </div>

              <fieldset className="rounded-md border border-border-subtle p-4">
                <legend className="px-2 text-sm font-medium text-content-primary">Categories</legend>
                {categories.length === 0 ? (
                  <p className="mt-3 text-xs text-content-tertiary">
                    Create categories inside Medusa to enable assignments.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {categories.map((category) => (
                      <Checkbox
                        key={category.id}
                        id={`${baseId}-category-${category.id}`}
                        label={category.label}
                        checked={selectedCategoryIds.has(category.id)}
                        onCheckedChange={(state) => {
                          toggleCategory(category.id, state === true)
                        }}
                      />
                    ))}
                  </div>
                )}
              </fieldset>
            </Card>
          </section>

          <section aria-labelledby={`${baseId}-step-2`} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id={`${baseId}-step-2`} className="text-lg font-semibold text-content-primary">
                Step 2 — Variant matrix
              </h2>

              <Button type="button" variant="secondary" onClick={addOptionRow}>
                Add option
              </Button>
            </div>

            <Card elevation="flat" className="space-y-4 p-6">
              {optionRows.length === 0 ? (
                <p className="text-sm text-content-secondary">Add at least one option row.</p>
              ) : (
                optionRows.map((row, rowIndex) => (
                  <div key={typeof row.medusaOptionId === "string" ? row.medusaOptionId : `${baseId}-opt-${rowIndex}`}>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="min-w-[12rem] flex-1 space-y-2">
                        <FormField label={`Option ${rowIndex + 1}`} htmlFor={`${baseId}-opt-${rowIndex}`}>
                          <Input
                            id={`${baseId}-opt-${rowIndex}`}
                            type="text"
                            placeholder='e.g. "Size"'
                            value={row.title}
                            autoComplete="off"
                            onChange={(e) => {
                              updateOptionRow(rowIndex, { title: e.target.value })
                            }}
                          />
                        </FormField>
                      </div>
                      <div className="min-w-[16rem] flex-[2] space-y-2">
                        <FormField
                          label="Values"
                          htmlFor={`${baseId}-opt-values-${rowIndex}`}
                          hint="Comma-separated (S, M, L)."
                        >
                          <Input
                            id={`${baseId}-opt-values-${rowIndex}`}
                            type="text"
                            value={row.values.join(", ")}
                            autoComplete="off"
                            onChange={(e) => {
                              updateOptionRow(rowIndex, {
                                values: splitOptionValuesCsv(e.target.value),
                              })
                            }}
                          />
                        </FormField>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          removeOptionRow(rowIndex)
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </section>

          <section aria-labelledby={`${baseId}-step-3`} className="space-y-4">
            <h2 id={`${baseId}-step-3`} className="text-lg font-semibold text-content-primary">
              Step 3 — Pricing &amp; inventory
            </h2>

            <Card elevation="flat" className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm" aria-label="Variant pricing grid">
                  <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-content-secondary">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Variant
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Attributes
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Price ({PRODUCT_FORM_PRICE_CURRENCY.toUpperCase()})
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Stock qty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantRowsPreview.map((row) => (
                      <tr key={row.comboKey} className="border-t border-border-subtle">
                        <td className="align-top px-4 py-3 text-content-primary">
                          {summarizeVariantRow(row.selections)}
                        </td>
                        <td className="align-top px-4 py-3 text-xs text-content-secondary">
                          {Object.keys(row.selections).length === 0
                            ? "—"
                            : Object.keys(row.selections)
                                .sort((a, b) => a.localeCompare(b))
                                .map((key) => `${key}: ${row.selections[key]}`)
                                .join(" · ")}
                        </td>
                        <td className="align-top px-4 py-3">
                          <div className="space-y-1">
                            <Input
                              type="text"
                              inputMode="decimal"
                              aria-label={`Price ${summarizeVariantRow(row.selections)} (${PRODUCT_FORM_PRICE_CURRENCY.toUpperCase()})`}
                              autoComplete="off"
                              placeholder="149.95"
                              value={row.priceDkk}
                              error={Boolean(fieldErrors[`price_${row.comboKey}`])}
                              aria-invalid={Boolean(fieldErrors[`price_${row.comboKey}`])}
                              onChange={(event) => {
                                updateEconomicsRow(row.comboKey, { priceDkk: event.target.value })
                              }}
                            />
                            {fieldErrors[`price_${row.comboKey}`] !== undefined ? (
                              <p className={formErrorClass} role="alert">
                                {fieldErrors[`price_${row.comboKey}`]}
                              </p>
                            ) : null}
                          </div>
                        </td>
                        <td className="align-top px-4 py-3">
                          <div className="space-y-1">
                            <Input
                              type="text"
                              inputMode="numeric"
                              aria-label={`Stock ${summarizeVariantRow(row.selections)}`}
                              autoComplete="off"
                              placeholder="25"
                              value={row.stock}
                              error={Boolean(fieldErrors[`stock_${row.comboKey}`])}
                              aria-invalid={Boolean(fieldErrors[`stock_${row.comboKey}`])}
                              onChange={(event) => {
                                updateEconomicsRow(row.comboKey, { stock: event.target.value })
                              }}
                            />
                            {fieldErrors[`stock_${row.comboKey}`] !== undefined ? (
                              <p className={formErrorClass} role="alert">
                                {fieldErrors[`stock_${row.comboKey}`]}
                              </p>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {variantRowsPreview.length === 0 ? (
                <p className="p-6 text-sm text-content-secondary">{fieldErrors.variants ?? "No variants."}</p>
              ) : null}
            </Card>
          </section>

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
