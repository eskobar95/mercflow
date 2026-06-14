import type { FormEvent, ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { PageHeader } from "@/components/ui/PageHeader"
import { Select } from "@/components/ui/Select"
import { Spinner } from "@/components/ui/Spinner"
import { useToast } from "@/components/ui/Toast"
import {
  SETTINGS_COUNTRY_OPTIONS,
  SETTINGS_TIMEZONE_OPTIONS,
} from "@/features/settings/settingsSelectOptions"
import type { GeneralSettingsFormValues } from "@/features/settings/types"
import { useUnsavedFormGuard } from "@/lib/react/useUnsavedFormGuard"

import { settingsGeneralBreadcrumbs } from "@/config/settingsBreadcrumbs"

import { useGeneralSettingsPage } from "./useGeneralSettingsPage"

type GeneralSettingsFormProps = {
  values: GeneralSettingsFormValues
  currencyOptions: Array<{ value: string; label: string }>
  saving: boolean
  errorMessage: string | null
  isDirty: boolean
  onChange: React.Dispatch<React.SetStateAction<GeneralSettingsFormValues>>
  onSubmit: () => Promise<boolean>
}

function GeneralSettingsForm({
  values,
  currencyOptions,
  saving,
  errorMessage,
  isDirty,
  onChange,
  onSubmit,
}: GeneralSettingsFormProps): ReactNode {
  useUnsavedFormGuard({ isDirty, baseTitle: "General settings" })

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    void onSubmit()
  }

  const updateField = <K extends keyof GeneralSettingsFormValues>(
    key: K,
    next: GeneralSettingsFormValues[K],
  ): void => {
    onChange((previous) => ({ ...previous, [key]: next }))
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      {errorMessage !== null ? (
        <div
          role="alert"
          className="rounded-lg border border-interactive-danger-subtle bg-surface-subtle px-4 py-3 text-sm text-content-danger"
        >
          {errorMessage}
        </div>
      ) : null}

      <Card className="space-y-5 p-6">
        <div>
          <h2 className="text-base font-semibold text-content-primary">Store details</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Basic information shown to your team and used across admin workflows.
          </p>
        </div>

        <FormField label="Store name" required>
          <Input
            value={values.storeName}
            disabled={saving}
            onChange={(event) => updateField("storeName", event.target.value)}
          />
        </FormField>

        <FormField label="Contact email" required hint="Used for operator notifications and support contact.">
          <Input
            type="email"
            autoComplete="email"
            value={values.contactEmail}
            disabled={saving}
            onChange={(event) => updateField("contactEmail", event.target.value)}
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Default currency" required>
            <Select
              value={values.defaultCurrency}
              options={currencyOptions}
              disabled={saving || currencyOptions.length === 0}
              placeholder="Select currency"
              onValueChange={(next) => updateField("defaultCurrency", next)}
            />
          </FormField>

          <FormField label="Timezone" required>
            <Select
              value={values.timezone}
              options={SETTINGS_TIMEZONE_OPTIONS}
              disabled={saving}
              placeholder="Select timezone"
              onValueChange={(next) => updateField("timezone", next)}
            />
          </FormField>
        </div>
      </Card>

      <Card className="space-y-5 p-6">
        <div>
          <h2 className="text-base font-semibold text-content-primary">Address</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Your business address for invoices, legal pages, and storefront identity.
          </p>
        </div>

        <FormField label="Street address" required>
          <Input
            value={values.address.street}
            disabled={saving}
            onChange={(event) =>
              onChange((previous) => ({
                ...previous,
                address: { ...previous.address, street: event.target.value },
              }))
            }
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="City" required>
            <Input
              value={values.address.city}
              disabled={saving}
              onChange={(event) =>
                onChange((previous) => ({
                  ...previous,
                  address: { ...previous.address, city: event.target.value },
                }))
              }
            />
          </FormField>

          <FormField label="Postal code" required>
            <Input
              value={values.address.postalCode}
              disabled={saving}
              onChange={(event) =>
                onChange((previous) => ({
                  ...previous,
                  address: { ...previous.address, postalCode: event.target.value },
                }))
              }
            />
          </FormField>
        </div>

        <FormField label="Country" required>
          <Select
            value={values.address.country}
            options={SETTINGS_COUNTRY_OPTIONS}
            disabled={saving}
            placeholder="Select country"
            onValueChange={(next) =>
              onChange((previous) => ({
                ...previous,
                address: { ...previous.address, country: next },
              }))
            }
          />
        </FormField>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {isDirty ? <p className="text-sm text-content-secondary">You have unsaved changes.</p> : null}
        <Button type="submit" variant="primary" disabled={saving || !isDirty}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  )
}

export function GeneralSettingsPage(): ReactNode {
  const { toast } = useToast()
  const { hasBackend, state, formValues, isDirty, currencyOptions, setFormValues, reload, save } =
    useGeneralSettingsPage()

  const handleSave = async (): Promise<boolean> => {
    const saved = await save()
    if (saved) {
      toast({
        title: "Store settings saved",
        description: "Your general settings were updated.",
        variant: "success",
      })
    }
    return saved
  }

  if (!hasBackend) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">
          Configure{" "}
          <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code> to manage store settings.
        </p>
      </div>
    )
  }

  if (state.phase === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8" aria-busy aria-live="polite">
        <Spinner label="Loading general settings" />
      </div>
    )
  }

  if (state.phase === "error") {
    return (
      <div className="space-y-6 p-6">
        <PageHeader
          title="General"
          description="Store name, contact details, currency, timezone, and business address."
          breadcrumbs={settingsGeneralBreadcrumbs()}
        />
        <Card className="space-y-4 p-6" role="alert">
          <p className="font-medium text-content-primary">Could not load store settings.</p>
          <p className="text-sm text-content-secondary">{state.message}</p>
          <Button type="button" variant="secondary" onClick={() => void reload()}>
            Try again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <PageHeader
        title="General"
        description="Store name, contact details, currency, timezone, and business address."
        breadcrumbs={settingsGeneralBreadcrumbs()}
      />
      <GeneralSettingsForm
        values={formValues}
        currencyOptions={currencyOptions}
        saving={state.saving}
        errorMessage={state.message}
        isDirty={isDirty}
        onChange={setFormValues}
        onSubmit={handleSave}
      />
    </div>
  )
}
