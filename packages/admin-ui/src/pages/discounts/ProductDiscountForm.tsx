import type { FormEvent, ReactNode } from "react"

import type { ProductDiscountFormState } from "@/features/discounts/discountFormTypes"

import { DiscountCatalogTargetingFields } from "./DiscountCatalogTargetingFields"
import { DiscountFormShell } from "./DiscountFormShell"

type ProductDiscountFormProps = {
  form: ProductDiscountFormState
  onChange: (next: ProductDiscountFormState) => void
  onSubmit: (event: FormEvent) => void
  submitLabel: string
  saving: boolean
  error: string | null
  disabled?: boolean
}

export function ProductDiscountForm({
  form,
  onChange,
  onSubmit,
  submitLabel,
  saving,
  error,
  disabled = false,
}: ProductDiscountFormProps): ReactNode {
  return (
    <DiscountFormShell
      form={form}
      onChange={(next) => {
        onChange({ ...form, ...next })
      }}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      saving={saving}
      error={error}
      disabled={disabled}
    >
      <DiscountCatalogTargetingFields
        appliesTo={form.appliesTo}
        collectionIds={form.collectionIds}
        productIds={form.productIds}
        disabled={disabled || saving}
        onAppliesToChange={(appliesTo) => {
          onChange({ ...form, appliesTo })
        }}
        onCollectionIdsChange={(collectionIds) => {
          onChange({ ...form, collectionIds })
        }}
        onProductIdsChange={(productIds) => {
          onChange({ ...form, productIds })
        }}
      />
    </DiscountFormShell>
  )
}

export function validateProductDiscountForm(form: ProductDiscountFormState): string | null {
  if (form.appliesTo === "collections" && form.collectionIds.length === 0) {
    return "Select at least one collection, or choose All products."
  }
  if (form.appliesTo === "products" && form.productIds.length === 0) {
    return "Select at least one product, or choose All products."
  }
  return null
}
