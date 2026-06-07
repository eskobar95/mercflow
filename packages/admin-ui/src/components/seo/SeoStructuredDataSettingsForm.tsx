import { type ReactNode, useEffect, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Spinner } from "@/components/ui/Spinner"
import type { JsonLdSettingsDto } from "@/features/seo/types"
import { useSeoStructuredDataSettings } from "@/hooks/useSeoStructuredDataSettings"

export function SeoStructuredDataSettingsForm(): ReactNode {
  const { state, reload, save } = useSeoStructuredDataSettings()
  const [settings, setSettings] = useState<JsonLdSettingsDto>({
    product: true,
    category: true,
    global: true,
  })
  const [saveSucceeded, setSaveSucceeded] = useState(false)

  useEffect(() => {
    if (state.phase === "ready" || state.phase === "save_error" || state.phase === "saving") {
      setSettings(state.json_ld_settings)
    }
  }, [state])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setSaveSucceeded(false)
    const ok = await save(settings)
    if (ok) {
      setSaveSucceeded(true)
    }
  }

  if (state.phase === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-content-secondary">
        <Spinner label="Loading structured data settings" className="gap-2" />
        <span>Loading structured data settings…</span>
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
        <output className="block rounded-lg border border-border-subtle bg-surface-subtle p-3 text-sm text-content-secondary">
          Structured data toggles saved. Storefront requests respect these flags per page type.
        </output>
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
          <h2 className="text-lg font-semibold text-content-primary">JSON-LD</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Control which schema.org blocks MercFlow exposes on store APIs. Organisation fields live
            under Settings → SEO → Organisation.
          </p>
        </div>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-content-primary">Enable per page type</legend>
          <label className="flex items-center gap-2 text-sm text-content-secondary">
            <input
              type="checkbox"
              checked={settings.product}
              disabled={isSaving}
              onChange={(e) => {
                setSettings((prev) => ({ ...prev, product: e.target.checked }))
              }}
            />
            Product pages (<span className="font-mono text-xs">Product</span> +{" "}
            <span className="font-mono text-xs">Offer</span>)
          </label>
          <label className="flex items-center gap-2 text-sm text-content-secondary">
            <input
              type="checkbox"
              checked={settings.category}
              disabled={isSaving}
              onChange={(e) => {
                setSettings((prev) => ({ ...prev, category: e.target.checked }))
              }}
            />
            Category pages (<span className="font-mono text-xs">BreadcrumbList</span>)
          </label>
          <label className="flex items-center gap-2 text-sm text-content-secondary">
            <input
              type="checkbox"
              checked={settings.global}
              disabled={isSaving}
              onChange={(e) => {
                setSettings((prev) => ({ ...prev, global: e.target.checked }))
              }}
            />
            Global (<span className="font-mono text-xs">WebSite</span> + optional{" "}
            <span className="font-mono text-xs">Organization</span>)
          </label>
        </fieldset>
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save structured data"}
        </Button>
      </Card>
    </form>
  )
}
