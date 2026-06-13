import type { ReactNode } from "react"

import { FormField } from "@/components/ui/FormField"
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import type { ProductScope } from "@/features/discounts/discountFormTypes"

type DiscountProductScopeFieldProps = {
  label: string
  value: ProductScope
  onChange: (value: ProductScope) => void
  disabled?: boolean
}

export function DiscountProductScopeField({
  label,
  value,
  onChange,
  disabled = false,
}: DiscountProductScopeFieldProps): ReactNode {
  return (
    <FormField label={label} required>
      <RadioGroup
        value={value}
        onValueChange={(next) => {
          if (next === "all" || next === "collections" || next === "products") {
            onChange(next)
          }
        }}
        className="space-y-2"
        disabled={disabled}
      >
        <RadioGroupItem value="all" label="Any products" id={`${label}-scope-all`} />
        <RadioGroupItem
          value="collections"
          label="Specific collections"
          id={`${label}-scope-collections`}
        />
        <RadioGroupItem
          value="products"
          label="Specific products"
          id={`${label}-scope-products`}
        />
      </RadioGroup>
      {value !== "all" ? (
        <p className="mt-2 text-xs text-content-tertiary">
          Product and collection pickers will be available when catalog targeting is wired to
          Medusa promotion rules.
        </p>
      ) : null}
    </FormField>
  )
}
