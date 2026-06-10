import { type FormEvent, type ReactNode, useId, useState } from "react"

import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Sheet } from "@/components/ui/Sheet"
import { Switch } from "@/components/ui/Switch"
import { packagingTypeSelectOptions } from "@/features/packaging/packagingTypeLabels"
import type {
  CreatePackagingTypeInput,
  PackagingTypeDto,
  PackagingTypeKind,
  UpdatePackagingTypeInput,
} from "@/features/packaging/types"
import {
  displayCmToMedusaMm,
  displayGToMedusaG,
  medusaGToDisplayG,
  medusaMmToDisplayCm,
} from "@/lib/products/productVariantShippingUnits"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

type PackagingTypeFormSheetProps = {
  open: boolean
  mode: "create" | "edit"
  packagingType: PackagingTypeDto | null
  saving: boolean
  errorMessage: string | null
  onOpenChange: (open: boolean) => void
  onSubmitCreate: (payload: CreatePackagingTypeInput) => Promise<void>
  onSubmitUpdate: (id: string, payload: UpdatePackagingTypeInput) => Promise<void>
}

type FormState = {
  name: string
  type: PackagingTypeKind
  lengthCm: string
  widthCm: string
  heightCm: string
  maxWeightG: string
  isActive: boolean
}

function initialFormState(packagingType: PackagingTypeDto | null): FormState {
  if (packagingType === null) {
    return {
      name: "",
      type: "box",
      lengthCm: "",
      widthCm: "",
      heightCm: "",
      maxWeightG: "",
      isActive: true,
    }
  }

  return {
    name: packagingType.name,
    type: packagingType.type,
    lengthCm: medusaMmToDisplayCm(packagingType.length_mm),
    widthCm: medusaMmToDisplayCm(packagingType.width_mm),
    heightCm: medusaMmToDisplayCm(packagingType.height_mm),
    maxWeightG: medusaGToDisplayG(packagingType.max_weight_g),
    isActive: packagingType.is_active,
  }
}

function parseFormPayload(form: FormState): CreatePackagingTypeInput | null {
  const name = form.name.trim()
  if (name === "") {
    return null
  }

  const lengthMm = displayCmToMedusaMm(form.lengthCm)
  const widthMm = displayCmToMedusaMm(form.widthCm)
  const heightMm = displayCmToMedusaMm(form.heightCm)
  const maxWeightG = displayGToMedusaG(form.maxWeightG)

  if (
    lengthMm === null ||
    widthMm === null ||
    heightMm === null ||
    maxWeightG === null ||
    lengthMm <= 0 ||
    widthMm <= 0 ||
    heightMm <= 0 ||
    maxWeightG <= 0
  ) {
    return null
  }

  return {
    name,
    type: form.type,
    length_mm: lengthMm,
    width_mm: widthMm,
    height_mm: heightMm,
    max_weight_g: maxWeightG,
    is_active: form.isActive,
  }
}

export function PackagingTypeFormSheet({
  open,
  mode,
  packagingType,
  saving,
  errorMessage,
  onOpenChange,
  onSubmitCreate,
  onSubmitUpdate,
}: PackagingTypeFormSheetProps): ReactNode {
  const formKey = `${mode}:${packagingType?.id ?? "new"}:${String(open)}`
  const [form, setForm] = useState<FormState>(() => initialFormState(packagingType))
  const [validationError, setValidationError] = useState<string | null>(null)
  const activeSwitchId = useId()

  useAdjustStateWhenKeyChanges(formKey, () => {
    setForm(initialFormState(packagingType))
    setValidationError(null)
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const payload = parseFormPayload(form)
    if (payload === null) {
      setValidationError(
        "Enter a name, positive dimensions in centimeters, and a positive max weight in grams."
      )
      return
    }
    setValidationError(null)
    void (async (): Promise<void> => {
      if (mode === "create") {
        await onSubmitCreate(payload)
        return
      }
      if (packagingType === null) {
        return
      }
      await onSubmitUpdate(packagingType.id, payload)
    })()
  }

  const sheetError = validationError ?? errorMessage

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add packaging type" : "Edit packaging type"}
      description="Dimensions are stored in millimeters; enter centimeters here."
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => {
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          <Button type="submit" form="packaging-type-form" variant="primary" disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Add packaging type" : "Save changes"}
          </Button>
        </div>
      }
    >
      <form id="packaging-type-form" className="space-y-4 p-4" onSubmit={handleSubmit}>
        <FormField label="Name" htmlFor="packaging-name" required>
          <Input
            id="packaging-name"
            value={form.name}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }}
            autoComplete="off"
          />
        </FormField>

        <FormField label="Type" htmlFor="packaging-type">
          <Select
            value={form.type}
            options={packagingTypeSelectOptions}
            aria-label="Packaging type"
            onValueChange={(value) => {
              setForm((prev) => ({ ...prev, type: value as PackagingTypeKind }))
            }}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Length (cm)" htmlFor="packaging-length" required>
            <Input
              id="packaging-length"
              inputMode="decimal"
              value={form.lengthCm}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, lengthCm: event.target.value }))
              }}
            />
          </FormField>
          <FormField label="Width (cm)" htmlFor="packaging-width" required>
            <Input
              id="packaging-width"
              inputMode="decimal"
              value={form.widthCm}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, widthCm: event.target.value }))
              }}
            />
          </FormField>
          <FormField label="Height (cm)" htmlFor="packaging-height" required>
            <Input
              id="packaging-height"
              inputMode="decimal"
              value={form.heightCm}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, heightCm: event.target.value }))
              }}
            />
          </FormField>
        </div>

        <FormField
          label="Max weight (g)"
          htmlFor="packaging-max-weight"
          hint="Enter grams — e.g. 500 g or 2000 g for 2 kg."
          required
        >
          <Input
            id="packaging-max-weight"
            inputMode="numeric"
            value={form.maxWeightG}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, maxWeightG: event.target.value }))
            }}
          />
        </FormField>

        <Switch
          id={activeSwitchId}
          checked={form.isActive}
          label="Active"
          onCheckedChange={(checked) => {
            setForm((prev) => ({ ...prev, isActive: checked }))
          }}
        />

        {sheetError ? (
          <p role="alert" className="text-sm text-content-danger">
            {sheetError}
          </p>
        ) : null}
      </form>
    </Sheet>
  )
}
