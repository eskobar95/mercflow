import { type ReactNode, useState } from "react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Select } from "@/components/ui/Select"
import { Switch } from "@/components/ui/Switch"
import type { ShipmondoLabelSettingsDto } from "@/features/connectors/shipmondoTypes"
import { useShipmondoConnectorSettings } from "@/hooks/useShipmondoConnectorSettings"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

const LABEL_FORMAT_OPTIONS = [
  { value: "10x19_pdf", label: "10×19 PDF (default)" },
  { value: "a4_pdf", label: "A4 PDF" },
  { value: "10x19_zpl", label: "10×19 ZPL" },
  { value: "compact_pdf", label: "Compact PDF" },
  { value: "compact_zpl", label: "Compact ZPL" },
] as const

type DraftState = ShipmondoLabelSettingsDto

function toDraft(settings: ShipmondoLabelSettingsDto): DraftState {
  return { ...settings }
}

export function ShipmondoSenderSettingsSection(props: {
  configured: boolean
  labelSettings: ShipmondoLabelSettingsDto
}): ReactNode {
  const { configured, labelSettings } = props
  const { patch } = useShipmondoConnectorSettings()
  const [draft, setDraft] = useState(toDraft(labelSettings))
  const [formError, setFormError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useAdjustStateWhenKeyChanges(JSON.stringify(labelSettings), () => {
    setDraft(toDraft(labelSettings))
    setFormError(null)
    setSavedMessage(null)
  })

  const handleSave = (): void => {
    setFormError(null)
    setSavedMessage(null)
    patch.mutate(
      {
        senderName: draft.senderName.trim(),
        senderAddress1: draft.senderAddress1.trim(),
        senderPostalCode: draft.senderPostalCode.trim(),
        senderCity: draft.senderCity.trim(),
        senderCountryCode: draft.senderCountryCode.trim().toUpperCase(),
        senderEmail: draft.senderEmail.trim(),
        senderPhone: draft.senderPhone.trim(),
        labelFormat: draft.labelFormat,
        ownAgreement: draft.ownAgreement,
      },
      {
        onSuccess: () => {
          setSavedMessage("Sender settings saved.")
        },
        onError: (error: Error) => {
          setFormError(error.message)
        },
      }
    )
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-surface-default p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-content-primary">Sender</h2>
        <p className="text-sm text-content-secondary">
          Required for Shipmondo label generation. These details appear as the sender party on each
          shipment.
        </p>
      </div>

      {!configured ? (
        <p className="mt-4 text-sm text-content-secondary">
          Save Shipmondo credentials before configuring the sender profile.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="shipmondo-sender-name" required>
                Sender name
              </Label>
              <Input
                id="shipmondo-sender-name"
                value={draft.senderName}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, senderName: event.target.value }))
                }}
              />
            </div>
            <div>
              <Label htmlFor="shipmondo-sender-email" required>
                Sender email
              </Label>
              <Input
                id="shipmondo-sender-email"
                type="email"
                value={draft.senderEmail}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, senderEmail: event.target.value }))
                }}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="shipmondo-sender-address" required>
                Address
              </Label>
              <Input
                id="shipmondo-sender-address"
                value={draft.senderAddress1}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, senderAddress1: event.target.value }))
                }}
              />
            </div>
            <div>
              <Label htmlFor="shipmondo-sender-postal" required>
                Postal code
              </Label>
              <Input
                id="shipmondo-sender-postal"
                value={draft.senderPostalCode}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, senderPostalCode: event.target.value }))
                }}
              />
            </div>
            <div>
              <Label htmlFor="shipmondo-sender-city" required>
                City
              </Label>
              <Input
                id="shipmondo-sender-city"
                value={draft.senderCity}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, senderCity: event.target.value }))
                }}
              />
            </div>
            <div>
              <Label htmlFor="shipmondo-sender-country" required>
                Country code
              </Label>
              <Input
                id="shipmondo-sender-country"
                maxLength={2}
                value={draft.senderCountryCode}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    senderCountryCode: event.target.value.toUpperCase(),
                  }))
                }}
              />
            </div>
            <div>
              <Label htmlFor="shipmondo-sender-phone" required>
                Phone
              </Label>
              <Input
                id="shipmondo-sender-phone"
                value={draft.senderPhone}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, senderPhone: event.target.value }))
                }}
              />
            </div>
            <div>
              <Label htmlFor="shipmondo-label-format">Label format</Label>
              <Select
                id="shipmondo-label-format"
                value={draft.labelFormat}
                options={LABEL_FORMAT_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                onValueChange={(value) => {
                  setDraft((current) => ({ ...current, labelFormat: value }))
                }}
              />
            </div>
            <div className="flex items-end">
              <Switch
                id="shipmondo-own-agreement"
                checked={draft.ownAgreement}
                label="Use own carrier agreement"
                onCheckedChange={(checked) => {
                  setDraft((current) => ({ ...current, ownAgreement: checked === true }))
                }}
              />
            </div>
          </div>

          {formError !== null ? (
            <p className="text-sm text-feedback-danger-content" role="alert">
              {formError}
            </p>
          ) : null}
          {savedMessage !== null ? (
            <p className="text-sm text-feedback-success-content" role="status">
              {savedMessage}
            </p>
          ) : null}

          <div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={patch.isPending}
              onClick={() => {
                handleSave()
              }}
            >
              {patch.isPending ? "Saving…" : "Save sender settings"}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
