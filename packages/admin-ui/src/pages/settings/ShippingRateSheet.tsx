import { type FormEvent, type ReactNode, useState } from "react"

import type { AdminShippingOption } from "@medusajs/types"

import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Sheet } from "@/components/ui/Sheet"
import type { ShippingRateFormInput } from "@/features/shipping/shippingSettingsApi"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

type ShippingRateSheetProps = {
  open: boolean
  mode: "create" | "edit"
  rate: AdminShippingOption | null
  saving: boolean
  errorMessage: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (input: ShippingRateFormInput) => Promise<void>
}

function amountFromRate(rate: AdminShippingOption | null): string {
  const amount = rate?.prices?.[0]?.amount
  return typeof amount === "number" && Number.isFinite(amount) ? (amount / 100).toFixed(2) : ""
}

export function ShippingRateSheet({
  open,
  mode,
  rate,
  saving,
  errorMessage,
  onOpenChange,
  onSubmit,
}: ShippingRateSheetProps): ReactNode {
  const [name, setName] = useState(rate?.name ?? "")
  const [amountMajor, setAmountMajor] = useState(amountFromRate(rate))
  const [localError, setLocalError] = useState<string | null>(null)

  useAdjustStateWhenKeyChanges(rate?.id ?? "create", () => {
    setName(rate?.name ?? "")
    setAmountMajor(amountFromRate(rate))
    setLocalError(null)
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!name.trim()) {
      setLocalError("Enter a rate name.")
      return
    }
    if (!amountMajor.trim()) {
      setLocalError("Enter a flat rate amount.")
      return
    }
    setLocalError(null)
    void onSubmit({ name: name.trim(), amountMajor, shippingProfileId: rate?.shipping_profile_id ?? "" })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add shipping rate" : "Edit shipping rate"}
      description="Flat rates apply a fixed shipping price for the selected profile."
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="shipping-rate-form" disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Add rate" : "Save changes"}
          </Button>
        </div>
      }
    >
      <form id="shipping-rate-form" className="space-y-4" onSubmit={handleSubmit}>
        <FormField label="Name" htmlFor="shipping-rate-name" required>
          <Input id="shipping-rate-name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField
          label="Flat rate amount"
          htmlFor="shipping-rate-amount"
          required
          hint="Major currency units for your default region (e.g. 49.00)."
        >
          <Input
            id="shipping-rate-amount"
            inputMode="decimal"
            value={amountMajor}
            onChange={(e) => setAmountMajor(e.target.value)}
          />
        </FormField>
        {localError ? (
          <p className="text-sm text-feedback-danger-content" role="alert">
            {localError}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="text-sm text-feedback-danger-content" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </Sheet>
  )
}
