import type { FormEvent, ReactNode } from "react"

import type { OrderDiscountFormState } from "@/features/discounts/discountFormTypes"

import { DiscountFormShell } from "./DiscountFormShell"

type OrderDiscountFormProps = {
  form: OrderDiscountFormState
  onChange: (next: OrderDiscountFormState) => void
  onSubmit: (event: FormEvent) => void
  submitLabel: string
  saving: boolean
  error: string | null
  disabled?: boolean
}

export function OrderDiscountForm({
  form,
  onChange,
  onSubmit,
  submitLabel,
  saving,
  error,
  disabled = false,
}: OrderDiscountFormProps): ReactNode {
  return (
    <DiscountFormShell
      form={form}
      onChange={onChange}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      saving={saving}
      error={error}
      disabled={disabled}
    >
      <p className="text-sm text-content-secondary">This discount applies to the order total.</p>
    </DiscountFormShell>
  )
}
