import { type FormEvent, type ReactNode, useState } from "react"

import type { AdminShippingProfile } from "@medusajs/types"

import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Sheet } from "@/components/ui/Sheet"
import type { ShippingProfileFormInput } from "@/features/shipping/shippingSettingsApi"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

const PROFILE_TYPE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "custom", label: "Custom" },
  { value: "gift_card", label: "Gift card" },
]

type ShippingProfileSheetProps = {
  open: boolean
  mode: "create" | "edit"
  profile: AdminShippingProfile | null
  saving: boolean
  errorMessage: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (input: ShippingProfileFormInput) => Promise<void>
}

export function ShippingProfileSheet({
  open,
  mode,
  profile,
  saving,
  errorMessage,
  onOpenChange,
  onSubmit,
}: ShippingProfileSheetProps): ReactNode {
  const [name, setName] = useState(profile?.name ?? "")
  const [type, setType] = useState(profile?.type ?? "default")
  const [localError, setLocalError] = useState<string | null>(null)

  useAdjustStateWhenKeyChanges(profile?.id ?? "create", () => {
    setName(profile?.name ?? "")
    setType(profile?.type ?? "default")
    setLocalError(null)
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setLocalError("Enter a profile name.")
      return
    }
    setLocalError(null)
    void onSubmit({ name: trimmed, type })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add shipping profile" : "Edit shipping profile"}
      description="Profiles group products that share the same shipping rates at checkout."
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="shipping-profile-form" disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Add profile" : "Save changes"}
          </Button>
        </div>
      }
    >
      <form id="shipping-profile-form" className="space-y-4" onSubmit={handleSubmit}>
        <FormField label="Name" htmlFor="shipping-profile-name" required>
          <Input id="shipping-profile-name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Type" htmlFor="shipping-profile-type" required>
          <Select
            id="shipping-profile-type"
            value={type}
            options={PROFILE_TYPE_OPTIONS}
            onValueChange={setType}
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
