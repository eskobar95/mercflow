import type { ReactNode } from "react"

import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import type { BuyXGetYFormValues } from "@/features/discounts/discountFormTypes"

import { DiscountProductScopeField } from "./DiscountProductScopeField"

type BuyXGetYCustomerBuysSectionProps = {
  values: BuyXGetYFormValues
  disabled: boolean
  onChange: (next: BuyXGetYFormValues) => void
}

export function BuyXGetYCustomerBuysSection({
  values,
  disabled,
  onChange,
}: BuyXGetYCustomerBuysSectionProps): ReactNode {
  return (
    <>
      <FormField label="Requirement" required>
        <RadioGroup
          value={values.buyMinimumType}
          onValueChange={(next) => {
            if (next === "quantity" || next === "amount") {
              onChange({ ...values, buyMinimumType: next })
            }
          }}
          className="space-y-2"
          disabled={disabled}
        >
          <RadioGroupItem value="quantity" label="Minimum quantity" id="buy-min-quantity" />
          <RadioGroupItem value="amount" label="Minimum amount" id="buy-min-amount" />
        </RadioGroup>
      </FormField>

      {values.buyMinimumType === "quantity" ? (
        <FormField label="Minimum quantity" htmlFor="buy-minimum-quantity" required>
          <Input
            id="buy-minimum-quantity"
            inputMode="numeric"
            value={values.buyMinimumQuantity}
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...values, buyMinimumQuantity: event.target.value })
            }}
          />
        </FormField>
      ) : (
        <FormField label="Minimum amount" htmlFor="buy-minimum-amount" required>
          <Input
            id="buy-minimum-amount"
            inputMode="decimal"
            value={values.buyMinimumAmount}
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...values, buyMinimumAmount: event.target.value })
            }}
          />
        </FormField>
      )}

      <DiscountProductScopeField
        label="From"
        value={values.buyScope}
        disabled={disabled}
        onChange={(buyScope) => {
          onChange({ ...values, buyScope })
        }}
      />
    </>
  )
}
