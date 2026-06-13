import type { ReactNode } from "react"

import { Checkbox } from "@/components/ui/Checkbox"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import type { DiscountConditionsFormState } from "@/features/discounts/discountFormTypes"

type DiscountConditionsSectionProps = {
  value: DiscountConditionsFormState
  onChange: (next: DiscountConditionsFormState) => void
  method: "code" | "automatic"
  disabled?: boolean
}

export function DiscountConditionsSection({
  value,
  onChange,
  method,
  disabled = false,
}: DiscountConditionsSectionProps): ReactNode {
  const patch = (partial: Partial<DiscountConditionsFormState>): void => {
    onChange({ ...value, ...partial })
  }

  return (
    <section aria-labelledby="discount-conditions-heading" className="space-y-6">
      <div>
        <h2 id="discount-conditions-heading" className="text-base font-semibold text-content-primary">
          Conditions
        </h2>
        <p className="mt-1 text-sm text-content-secondary">
          Set minimum requirements, customer eligibility, usage limits, and active dates.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Minimum purchase amount"
          htmlFor="discount-min-purchase"
          hint="Leave blank for no minimum order value."
        >
          <Input
            id="discount-min-purchase"
            type="number"
            min={0}
            step="0.01"
            disabled={disabled}
            value={value.minPurchaseAmount}
            onChange={(event) => {
              patch({ minPurchaseAmount: event.target.value })
            }}
          />
        </FormField>

        <FormField
          label="Minimum quantity"
          htmlFor="discount-min-quantity"
          hint="Minimum number of items in the cart."
        >
          <Input
            id="discount-min-quantity"
            type="number"
            min={1}
            step={1}
            disabled={disabled}
            value={value.minQuantity}
            onChange={(event) => {
              patch({ minQuantity: event.target.value })
            }}
          />
        </FormField>
      </div>

      <FormField label="Customer eligibility" htmlFor="discount-eligibility-all">
        <RadioGroup
          value={value.customerEligibility}
          disabled={disabled}
          onValueChange={(next) => {
            if (next === "all" || next === "segments" || next === "customers") {
              patch({ customerEligibility: next })
            }
          }}
        >
          <RadioGroupItem id="discount-eligibility-all" value="all" label="All customers" />
          <RadioGroupItem
            id="discount-eligibility-segments"
            value="segments"
            label="Specific customer segments"
          />
          <RadioGroupItem
            id="discount-eligibility-customers"
            value="customers"
            label="Specific customers"
          />
        </RadioGroup>
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Usage limit (total)"
          htmlFor="discount-usage-total"
          hint={
            method === "automatic"
              ? "Automatic discounts cannot have a total usage limit."
              : "Leave blank for unlimited uses."
          }
        >
          <Input
            id="discount-usage-total"
            type="number"
            min={1}
            step={1}
            disabled={disabled || method === "automatic"}
            value={value.usageLimitTotal}
            onChange={(event) => {
              patch({ usageLimitTotal: event.target.value })
            }}
          />
        </FormField>

        <FormField
          label="Usage limit (per customer)"
          htmlFor="discount-usage-per-customer"
          hint="Maximum uses per individual customer."
        >
          <Input
            id="discount-usage-per-customer"
            type="number"
            min={1}
            step={1}
            disabled={disabled}
            value={value.usageLimitPerCustomer}
            onChange={(event) => {
              patch({ usageLimitPerCustomer: event.target.value })
            }}
          />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Start date" htmlFor="discount-starts-at">
          <Input
            id="discount-starts-at"
            type="datetime-local"
            disabled={disabled}
            value={value.startsAt}
            onChange={(event) => {
              patch({ startsAt: event.target.value })
            }}
          />
        </FormField>

        <FormField label="End date" htmlFor="discount-ends-at" hint="Leave blank for no end date.">
          <Input
            id="discount-ends-at"
            type="datetime-local"
            disabled={disabled}
            value={value.endsAt}
            onChange={(event) => {
              patch({ endsAt: event.target.value })
            }}
          />
        </FormField>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-content-primary">Can be combined with</legend>
        <div className="space-y-2">
          <Checkbox
            id="discount-combine-product"
            label="Product discounts"
            disabled={disabled}
            checked={value.combineWithProduct}
            onCheckedChange={(checked) => {
              patch({ combineWithProduct: checked === true })
            }}
          />
          <Checkbox
            id="discount-combine-order"
            label="Order discounts"
            disabled={disabled}
            checked={value.combineWithOrder}
            onCheckedChange={(checked) => {
              patch({ combineWithOrder: checked === true })
            }}
          />
          <Checkbox
            id="discount-combine-shipping"
            label="Shipping discounts"
            disabled={disabled}
            checked={value.combineWithShipping}
            onCheckedChange={(checked) => {
              patch({ combineWithShipping: checked === true })
            }}
          />
        </div>
      </fieldset>
    </section>
  )
}
