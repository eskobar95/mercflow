import type { ReactNode } from "react"

import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import type { BuyXGetYFormValues, GetDiscountKind } from "@/features/discounts/discountFormTypes"

import { DiscountProductScopeField } from "./DiscountProductScopeField"

type BuyXGetYCustomerGetsSectionProps = {
  values: BuyXGetYFormValues
  disabled: boolean
  onChange: (next: BuyXGetYFormValues) => void
}

export function BuyXGetYCustomerGetsSection({
  values,
  disabled,
  onChange,
}: BuyXGetYCustomerGetsSectionProps): ReactNode {
  return (
    <>
      <FormField label="Quantity" htmlFor="get-quantity" required>
        <Input
          id="get-quantity"
          inputMode="numeric"
          value={values.getQuantity}
          disabled={disabled}
          onChange={(event) => {
            onChange({ ...values, getQuantity: event.target.value })
          }}
        />
      </FormField>

      <FormField label="Discount type" required>
        <RadioGroup
          value={values.getDiscountKind}
          onValueChange={(next) => {
            if (next === "percentage" || next === "fixed" || next === "free") {
              onChange({ ...values, getDiscountKind: next as GetDiscountKind })
            }
          }}
          className="space-y-2"
          disabled={disabled}
        >
          <RadioGroupItem value="percentage" label="Percentage off" id="get-kind-percent" />
          <RadioGroupItem value="fixed" label="Fixed amount off" id="get-kind-fixed" />
          <RadioGroupItem value="free" label="Free" id="get-kind-free" />
        </RadioGroup>
      </FormField>

      {values.getDiscountKind === "percentage" ? (
        <FormField label="Percentage off" htmlFor="get-percentage" required>
          <Input
            id="get-percentage"
            inputMode="numeric"
            value={values.getPercentage}
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...values, getPercentage: event.target.value })
            }}
          />
        </FormField>
      ) : null}

      {values.getDiscountKind === "fixed" ? (
        <FormField label="Fixed amount off" htmlFor="get-fixed-amount" required>
          <Input
            id="get-fixed-amount"
            inputMode="decimal"
            value={values.getFixedAmount}
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...values, getFixedAmount: event.target.value })
            }}
          />
        </FormField>
      ) : null}

      <DiscountProductScopeField
        label="From"
        value={values.getScope}
        disabled={disabled}
        onChange={(getScope) => {
          onChange({ ...values, getScope })
        }}
      />

      <FormField
        label="Maximum uses per order"
        htmlFor="max-uses-per-order"
        hint="How many times the reward can apply on a single order."
        required
      >
        <Input
          id="max-uses-per-order"
          inputMode="numeric"
          value={values.maxUsesPerOrder}
          disabled={disabled}
          onChange={(event) => {
            onChange({ ...values, maxUsesPerOrder: event.target.value })
          }}
        />
      </FormField>
    </>
  )
}
