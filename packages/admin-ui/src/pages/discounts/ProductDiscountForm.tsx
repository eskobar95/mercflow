import type { FormEvent, ReactNode } from "react"

import { FormField } from "@/components/ui/FormField"
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import type { ProductScope, ProductDiscountFormState } from "@/features/discounts/discountFormTypes"

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
      <FormField label="Applies to" htmlFor="discount-applies-all">
        <RadioGroup
          value={form.appliesTo}
          disabled={disabled || saving}
          onValueChange={(next) => {
            if (next === "all" || next === "collections" || next === "products") {
              onChange({ ...form, appliesTo: next as ProductScope })
            }
          }}
        >
          <RadioGroupItem id="discount-applies-all" value="all" label="All products" />
          <RadioGroupItem
            id="discount-applies-collections"
            value="collections"
            label="Specific collections"
          />
          <RadioGroupItem
            id="discount-applies-products"
            value="products"
            label="Specific products"
          />
        </RadioGroup>
      </FormField>
    </DiscountFormShell>
  )
}
