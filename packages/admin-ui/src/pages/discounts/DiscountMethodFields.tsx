import type { ReactNode } from "react"

import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import type { DiscountMethod } from "@/features/discounts/discountFormTypes"

import { DiscountCodeInput } from "./DiscountCodeInput"

type DiscountMethodFieldsProps = {
  name: string
  method: DiscountMethod
  code: string
  disabled?: boolean
  onNameChange: (value: string) => void
  onMethodChange: (value: DiscountMethod) => void
  onCodeChange: (value: string) => void
}

export function DiscountMethodFields({
  name,
  method,
  code,
  disabled = false,
  onNameChange,
  onMethodChange,
  onCodeChange,
}: DiscountMethodFieldsProps): ReactNode {
  return (
    <div className="space-y-4">
      <FormField label="Discount name" htmlFor="discount-name" required>
        <Input
          id="discount-name"
          value={name}
          disabled={disabled}
          placeholder="Summer bundle offer"
          onChange={(event) => {
            onNameChange(event.target.value)
          }}
        />
      </FormField>

      <FormField label="Method" required>
        <RadioGroup
          value={method}
          onValueChange={(next) => {
            if (next === "code" || next === "automatic") {
              onMethodChange(next)
            }
          }}
          className="space-y-2"
          disabled={disabled}
        >
          <RadioGroupItem value="code" label="Discount code" id="discount-method-code" />
          <RadioGroupItem value="automatic" label="Automatic discount" id="discount-method-auto" />
        </RadioGroup>
      </FormField>

      {method === "code" ? (
        <DiscountCodeInput value={code} disabled={disabled} onChange={onCodeChange} />
      ) : null}
    </div>
  )
}
