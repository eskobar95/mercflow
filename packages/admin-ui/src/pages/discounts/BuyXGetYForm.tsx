import type { FormEvent, ReactNode } from "react"
import { useState } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { buildBuyXGetYCreatePayload } from "@/features/discounts/buildCreateDiscountPayload"
import {
  DEFAULT_BUY_X_GET_Y_VALUES,
  type BuyXGetYFormValues,
} from "@/features/discounts/discountFormTypes"
import { createAdminDiscount } from "@/features/discounts/discountsApi"

import { BuyXGetYCustomerBuysSection } from "./BuyXGetYCustomerBuysSection"
import { BuyXGetYCustomerGetsSection } from "./BuyXGetYCustomerGetsSection"
import { DiscountMethodFields } from "./DiscountMethodFields"

type BuyXGetYFormProps = {
  disabled?: boolean
  onCreated: (discountId: string) => void
}

function validateValues(values: BuyXGetYFormValues): string | null {
  if (values.name.trim() === "") {
    return "Discount name is required."
  }
  if (values.method === "code" && values.code.trim() === "") {
    return "Discount code is required."
  }
  if (values.buyMinimumType === "quantity" && values.buyMinimumQuantity.trim() === "") {
    return "Minimum purchase quantity is required."
  }
  if (values.buyMinimumType === "amount" && values.buyMinimumAmount.trim() === "") {
    return "Minimum purchase amount is required."
  }
  if (values.getDiscountKind === "fixed" && values.getFixedAmount.trim() === "") {
    return "Fixed discount amount is required."
  }
  return null
}

export function BuyXGetYForm({ disabled = false, onCreated }: BuyXGetYFormProps): ReactNode {
  const [values, setValues] = useState<BuyXGetYFormValues>(DEFAULT_BUY_X_GET_Y_VALUES)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const validationError = validateValues(values)
    if (validationError !== null) {
      setErrorMessage(validationError)
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const created = await createAdminDiscount(buildBuyXGetYCreatePayload(values))
      onCreated(created.id)
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create discount")
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldDisabled = disabled || isSubmitting

  return (
    <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
      <Card compact className="space-y-4">
        <h2 className="text-base font-semibold text-content-primary">Discount details</h2>
        <DiscountMethodFields
          name={values.name}
          method={values.method}
          code={values.code}
          disabled={fieldDisabled}
          onNameChange={(name) => {
            setValues((previous) => ({ ...previous, name }))
          }}
          onMethodChange={(method) => {
            setValues((previous) => ({ ...previous, method }))
          }}
          onCodeChange={(code) => {
            setValues((previous) => ({ ...previous, code }))
          }}
        />
      </Card>

      <Card compact className="space-y-4">
        <h2 className="text-base font-semibold text-content-primary">Customer buys</h2>
        <BuyXGetYCustomerBuysSection
          values={values}
          disabled={fieldDisabled}
          onChange={setValues}
        />
      </Card>

      <Card compact className="space-y-4">
        <h2 className="text-base font-semibold text-content-primary">Customer gets</h2>
        <BuyXGetYCustomerGetsSection
          values={values}
          disabled={fieldDisabled}
          onChange={setValues}
        />
      </Card>

      {errorMessage !== null ? (
        <p className="text-sm text-feedback-danger-content" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={fieldDisabled}>
          {isSubmitting ? "Saving…" : "Save discount"}
        </Button>
      </div>
    </form>
  )
}
