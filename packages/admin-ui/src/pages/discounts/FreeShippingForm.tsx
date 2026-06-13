import type { FormEvent, ReactNode } from "react"
import { useState } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Checkbox } from "@/components/ui/Checkbox"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import { buildFreeShippingCreatePayload } from "@/features/discounts/buildCreateDiscountPayload"
import {
  DEFAULT_FREE_SHIPPING_VALUES,
  FREE_SHIPPING_COUNTRY_OPTIONS,
  type FreeShippingFormValues,
} from "@/features/discounts/discountFormTypes"
import { createAdminDiscount } from "@/features/discounts/discountsApi"

import { DiscountMethodFields } from "./DiscountMethodFields"

type FreeShippingFormProps = {
  disabled?: boolean
  onCreated: (discountId: string) => void
}

function validateValues(values: FreeShippingFormValues): string | null {
  if (values.name.trim() === "") {
    return "Discount name is required."
  }
  if (values.method === "code" && values.code.trim() === "") {
    return "Discount code is required."
  }
  if (values.countryMode === "specific" && values.countryCodes.length === 0) {
    return "Select at least one country."
  }
  return null
}

export function FreeShippingForm({ disabled = false, onCreated }: FreeShippingFormProps): ReactNode {
  const [values, setValues] = useState<FreeShippingFormValues>(DEFAULT_FREE_SHIPPING_VALUES)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleCountry = (code: string, checked: boolean): void => {
    setValues((previous) => {
      const nextCodes = checked
        ? [...previous.countryCodes, code]
        : previous.countryCodes.filter((entry) => entry !== code)
      return { ...previous, countryCodes: nextCodes }
    })
  }

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
      const created = await createAdminDiscount(buildFreeShippingCreatePayload(values))
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
        <h2 className="text-base font-semibold text-content-primary">Shipping countries</h2>
        <FormField label="Countries" required>
          <RadioGroup
            value={values.countryMode}
            onValueChange={(next) => {
              if (next === "all" || next === "specific") {
                setValues((previous) => ({ ...previous, countryMode: next }))
              }
            }}
            className="space-y-2"
            disabled={fieldDisabled}
          >
            <RadioGroupItem value="all" label="All countries" id="shipping-countries-all" />
            <RadioGroupItem
              value="specific"
              label="Specific countries"
              id="shipping-countries-specific"
            />
          </RadioGroup>
        </FormField>

        {values.countryMode === "specific" ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-content-primary">Select countries</legend>
            {FREE_SHIPPING_COUNTRY_OPTIONS.map((country) => (
              <Checkbox
                key={country.code}
                id={`shipping-country-${country.code}`}
                label={`${country.label} (${country.code})`}
                checked={values.countryCodes.includes(country.code)}
                disabled={fieldDisabled}
                onCheckedChange={(checked) => {
                  toggleCountry(country.code, checked === true)
                }}
              />
            ))}
          </fieldset>
        ) : null}

        <FormField
          label="Exclude above order total"
          htmlFor="shipping-exclude-above"
          hint="Optional. Do not apply free shipping when the order total exceeds this amount."
        >
          <Input
            id="shipping-exclude-above"
            inputMode="decimal"
            value={values.excludeAbove}
            disabled={fieldDisabled}
            placeholder="Leave empty for no limit"
            onChange={(event) => {
              setValues((previous) => ({ ...previous, excludeAbove: event.target.value }))
            }}
          />
        </FormField>
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
