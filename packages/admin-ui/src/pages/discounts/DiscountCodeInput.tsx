import type { ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { generateDiscountCode } from "@/features/discounts/generateDiscountCode"

type DiscountCodeInputProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
}

export function DiscountCodeInput({
  value,
  onChange,
  disabled = false,
  error,
}: DiscountCodeInputProps): ReactNode {
  return (
    <FormField
      label="Discount code"
      htmlFor="discount-code"
      hint="Customers enter this code at checkout."
      error={error}
      required
    >
      <div className="flex gap-2">
        <Input
          id="discount-code"
          value={value}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          className="font-mono uppercase"
          onChange={(event) => {
            onChange(event.target.value.toUpperCase())
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled={disabled}
          onClick={() => {
            onChange(generateDiscountCode())
          }}
        >
          Generate
        </Button>
      </div>
    </FormField>
  )
}
