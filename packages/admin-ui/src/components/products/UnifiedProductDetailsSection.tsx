import type { ReactNode } from "react"

import { Card } from "@/components/ui/Card"
import { Checkbox } from "@/components/ui/Checkbox"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Switch } from "@/components/ui/Switch"
import { Textarea } from "@/components/ui/Textarea"
import type { UnifiedCatalogProductFormErrors } from "@/hooks/products/useUnifiedCatalogProductForm"

type CategoryOption = {
  id: string
  label: string
}

type UnifiedProductDetailsSectionProps = {
  baseId: string
  title: string
  description: string
  isPublished: boolean
  categories: CategoryOption[]
  selectedCategoryIds: Set<string>
  fieldErrors: UnifiedCatalogProductFormErrors
  setTitle: (value: string) => void
  setDescription: (value: string) => void
  setIsPublished: (value: boolean) => void
  toggleCategory: (categoryId: string, checked: boolean) => void
}

export function UnifiedProductDetailsSection({
  baseId,
  title,
  description,
  isPublished,
  categories,
  selectedCategoryIds,
  fieldErrors,
  setTitle,
  setDescription,
  setIsPublished,
  toggleCategory,
}: UnifiedProductDetailsSectionProps): ReactNode {
  const titleFieldId = `${baseId}-title`
  const descriptionFieldId = `${baseId}-description`
  const publishFieldId = `${baseId}-publish`

  return (
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
  )
}
