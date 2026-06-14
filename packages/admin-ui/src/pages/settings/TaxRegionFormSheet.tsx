import { type FormEvent, type ReactNode, useState } from "react"

import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Sheet } from "@/components/ui/Sheet"
import { SETTINGS_COUNTRY_OPTIONS } from "@/features/settings/settingsSelectOptions"
import { validateTaxRegionForm } from "@/features/settings/taxSettingsApi"
import type { TaxRegionRow } from "@/features/settings/types"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

type TaxRegionFormSheetProps = {
  open: boolean
  mode: "create" | "edit"
  region: TaxRegionRow | null
  saving: boolean
  errorMessage: string | null
  onOpenChange: (open: boolean) => void
  onSubmitCreate: (input: { countryCode: string; name: string; ratePercent: number }) => Promise<void>
  onSubmitUpdate: (input: { rateId: string; name: string; ratePercent: number }) => Promise<void>
}

type TaxRegionFormState = {
  countryCode: string
  name: string
  ratePercent: string
}

function initialFormState(region: TaxRegionRow | null): TaxRegionFormState {
  if (region === null) {
    return { countryCode: "dk", name: "", ratePercent: "25" }
  }
  return {
    countryCode: region.countryCode,
    name: region.name,
    ratePercent: region.ratePercent === null ? "" : String(region.ratePercent),
  }
}

export function TaxRegionFormSheet({
  open,
  mode,
  region,
  saving,
  errorMessage,
  onOpenChange,
  onSubmitCreate,
  onSubmitUpdate,
}: TaxRegionFormSheetProps): ReactNode {
  const [formState, setFormState] = useState<TaxRegionFormState>(() => initialFormState(region))
  const [localError, setLocalError] = useState<string | null>(null)

  useAdjustStateWhenKeyChanges(`${open}-${mode}-${region?.id ?? "new"}`, () => {
    setFormState(initialFormState(region))
    setLocalError(null)
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const validationError = validateTaxRegionForm(formState)
    if (validationError !== null) {
      setLocalError(validationError)
      return
    }
    const ratePercent = Number.parseFloat(formState.ratePercent)
    void (async (): Promise<void> => {
      if (mode === "create") {
        await onSubmitCreate({
          countryCode: formState.countryCode,
          name: formState.name,
          ratePercent,
        })
        return
      }
      if (region?.rateId === null || region?.rateId === undefined) {
        setLocalError("This tax region has no editable rate.")
        return
      }
      await onSubmitUpdate({ rateId: region.rateId, name: formState.name, ratePercent })
    })()
  }

  const displayError = localError ?? errorMessage

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add tax region" : "Edit tax region"}
      description="Configure the country, display name, and percentage rate charged at checkout."
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="tax-region-form" variant="primary" disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Add region" : "Save changes"}
          </Button>
        </div>
      }
    >
      <form id="tax-region-form" className="space-y-5" onSubmit={handleSubmit}>
        {displayError !== null ? (
          <p role="alert" className="text-sm text-content-danger">
            {displayError}
          </p>
        ) : null}

        <FormField label="Country" required>
          <Select
            value={formState.countryCode}
            options={SETTINGS_COUNTRY_OPTIONS}
            disabled={saving || mode === "edit"}
            placeholder="Select country"
            onValueChange={(next) => setFormState((previous) => ({ ...previous, countryCode: next }))}
          />
        </FormField>

        <FormField label="Tax name" required hint="Shown in admin and on invoices.">
          <Input
            value={formState.name}
            disabled={saving}
            onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
          />
        </FormField>

        <FormField label="Rate (%)" required>
          <Input
            inputMode="decimal"
            value={formState.ratePercent}
            disabled={saving}
            onChange={(event) =>
              setFormState((previous) => ({ ...previous, ratePercent: event.target.value }))
            }
          />
        </FormField>
      </form>
    </Sheet>
  )
}
