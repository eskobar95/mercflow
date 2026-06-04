import { useEffect, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Spinner } from "@/components/ui/Spinner"
import {
  useSeoOrganizationSettings,
  type SeoOrganizationFormValues,
} from "@/hooks/useSeoOrganizationSettings"

export function SeoOrganizationSettingsForm(): JSX.Element {
  const { state, reload, save } = useSeoOrganizationSettings()
  const [values, setValues] = useState<SeoOrganizationFormValues>({
    storefront_url: "",
    org_name: "",
    org_logo_url: "",
    social_facebook: "",
    social_instagram: "",
    social_linkedin: "",
  })
  const [saveSucceeded, setSaveSucceeded] = useState(false)

  useEffect(() => {
    if (state.phase === "ready" || state.phase === "save_error" || state.phase === "saving") {
      setValues(state.values)
    }
  }, [state])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setSaveSucceeded(false)
    const ok = await save(values)
    if (ok) {
      setSaveSucceeded(true)
    }
  }

  if (state.phase === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-content-secondary">
        <Spinner label="Loading organisation settings" className="gap-2" />
        <span>Loading organisation settings…</span>
      </div>
    )
  }

  if (state.phase === "error") {
    return (
      <div
        role="alert"
        className="rounded-lg border border-interactive-danger-subtle bg-surface-default p-4 shadow-sm"
      >
        <p className="text-sm font-medium text-content-danger">Unable to load settings</p>
        <p className="mt-2 text-sm text-content-secondary">{state.message}</p>
        <Button type="button" variant="secondary" className="mt-4" onClick={() => void reload()}>
          Retry
        </Button>
      </div>
    )
  }

  const isSaving = state.phase === "saving"
  const errorMessage = state.phase === "save_error" ? state.message : null

  return (
    <form className="space-y-6" onSubmit={(e) => void handleSubmit(e)} noValidate>
      {saveSucceeded ? (
        <div
          role="status"
          className="rounded-lg border border-border-subtle bg-surface-subtle p-3 text-sm text-content-secondary"
        >
          Organisation settings saved. JSON-LD, OG, canonical, and sitemap use these values per
          tenant.
        </div>
      ) : null}
      {errorMessage !== null ? (
        <div
          role="alert"
          className="rounded-lg border border-interactive-danger-subtle bg-surface-default p-3 text-sm text-content-danger"
        >
          {errorMessage}
        </div>
      ) : null}

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-content-primary">Storefront</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Public origin for canonical URLs, JSON-LD, feeds, and Host→tenant resolution (no trailing
            slash required).
          </p>
        </div>
        <FormField label="Storefront URL" hint="Example: https://shop.example">
          <Input
            type="url"
            value={values.storefront_url}
            disabled={isSaving}
            placeholder="https://"
            onChange={(e) => {
              setValues((prev) => ({ ...prev, storefront_url: e.target.value }))
            }}
          />
        </FormField>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-content-primary">Organisation</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Used for global JSON-LD <span className="font-mono text-xs">Organization</span> when a
            name is set. Leave empty to omit the block.
          </p>
        </div>
        <FormField label="Organisation name">
          <Input
            value={values.org_name}
            disabled={isSaving}
            onChange={(e) => {
              setValues((prev) => ({ ...prev, org_name: e.target.value }))
            }}
          />
        </FormField>
        <FormField label="Logo URL" hint="Absolute HTTPS URL to a square or wide logo">
          <Input
            type="url"
            value={values.org_logo_url}
            disabled={isSaving}
            placeholder="https://"
            onChange={(e) => {
              setValues((prev) => ({ ...prev, org_logo_url: e.target.value }))
            }}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
          <FormField label="Facebook URL">
            <Input
              type="url"
              value={values.social_facebook}
              disabled={isSaving}
              placeholder="https://"
              onChange={(e) => {
                setValues((prev) => ({ ...prev, social_facebook: e.target.value }))
              }}
            />
          </FormField>
          <FormField label="Instagram URL">
            <Input
              type="url"
              value={values.social_instagram}
              disabled={isSaving}
              placeholder="https://"
              onChange={(e) => {
                setValues((prev) => ({ ...prev, social_instagram: e.target.value }))
              }}
            />
          </FormField>
          <FormField label="LinkedIn URL">
            <Input
              type="url"
              value={values.social_linkedin}
              disabled={isSaving}
              placeholder="https://"
              onChange={(e) => {
                setValues((prev) => ({ ...prev, social_linkedin: e.target.value }))
              }}
            />
          </FormField>
        </div>
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save organisation"}
        </Button>
      </Card>
    </form>
  )
}
