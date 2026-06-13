import type { FormEvent, ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import type { DiscountFormCoreState } from "@/features/discounts/discountFormTypes"

import { DiscountCodeInput } from "./DiscountCodeInput"
import { DiscountConditionsSection } from "./DiscountConditionsSection"

type DiscountFormShellProps = {
  form: DiscountFormCoreState
  onChange: (next: DiscountFormCoreState) => void
  children?: ReactNode
  onSubmit: (event: FormEvent) => void
  submitLabel: string
  saving: boolean
  error: string | null
  disabled?: boolean
}

export function DiscountFormShell({
  form,
  onChange,
  children,
  onSubmit,
  submitLabel,
  saving,
  error,
  disabled = false,
}: DiscountFormShellProps): ReactNode {
  const patch = (partial: Partial<DiscountFormCoreState>): void => {
    onChange({ ...form, ...partial })
  }

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      {error !== null ? (
        <div
          className="rounded-sm border border-feedback-danger-border bg-feedback-danger-subtle px-4 py-3 text-sm text-feedback-danger-content"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <Card compact>
        <div className="space-y-4">
          <FormField label="Discount name" htmlFor="discount-name" required>
            <Input
              id="discount-name"
              value={form.name}
              disabled={disabled || saving}
              onChange={(event) => {
                patch({ name: event.target.value })
              }}
            />
          </FormField>

          <FormField label="Method" htmlFor="discount-method-code">
            <RadioGroup
              value={form.method}
              disabled={disabled || saving}
              onValueChange={(next) => {
                if (next === "code" || next === "automatic") {
                  patch({ method: next })
                }
              }}
            >
              <RadioGroupItem
                id="discount-method-code"
                value="code"
                label="Discount code — customers enter a code at checkout"
              />
              <RadioGroupItem
                id="discount-method-automatic"
                value="automatic"
                label="Automatic — applies without a code"
              />
            </RadioGroup>
          </FormField>

          {form.method === "code" ? (
            <DiscountCodeInput
              value={form.code}
              disabled={disabled || saving}
              onChange={(code) => {
                patch({ code })
              }}
            />
          ) : null}
        </div>
      </Card>

      <Card compact>
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-content-primary">Discount value</h2>
          <FormField label="Value type" htmlFor="discount-value-percentage">
            <RadioGroup
              value={form.valueType}
              disabled={disabled || saving}
              onValueChange={(next) => {
                if (next === "percentage" || next === "fixed") {
                  patch({ valueType: next })
                }
              }}
            >
              <RadioGroupItem id="discount-value-percentage" value="percentage" label="Percentage" />
              <RadioGroupItem id="discount-value-fixed" value="fixed" label="Fixed amount" />
            </RadioGroup>
          </FormField>

          <FormField
            label={form.valueType === "percentage" ? "Percentage off" : "Fixed amount off"}
            htmlFor="discount-value"
            required
          >
            <Input
              id="discount-value"
              type="number"
              min={0}
              step={form.valueType === "percentage" ? "0.01" : "0.01"}
              disabled={disabled || saving}
              value={form.value}
              onChange={(event) => {
                patch({ value: event.target.value })
              }}
            />
          </FormField>

          {children}
        </div>
      </Card>

      <Card compact>
        <DiscountConditionsSection
          value={form.conditions}
          method={form.method}
          disabled={disabled || saving}
          onChange={(conditions) => {
            patch({ conditions })
          }}
        />
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={disabled || saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  )
}
