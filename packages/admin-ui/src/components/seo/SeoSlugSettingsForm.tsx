import { type ReactNode, useEffect, useMemo, useState, type FormEvent } from "react"
import { slugifyForStrategy } from "@mercflow/seo-module/slug"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Spinner } from "@/components/ui/Spinner"
import type { SlugStrategy } from "@/features/seo/types"
import { useSeoSlugSettings } from "@/hooks/useSeoSlugSettings"

export function SeoSlugSettingsForm(): ReactNode {
  const { state, reload, save } = useSeoSlugSettings()
  const [strategy, setStrategy] = useState<SlugStrategy>("nordic")
  const [previewTitle, setPreviewTitle] = useState("Rødgrød med fløde")
  const [saveSucceeded, setSaveSucceeded] = useState(false)

  useEffect(() => {
    if (state.phase === "ready" || state.phase === "save_error") {
      setStrategy(state.slug_strategy)
    }
  }, [state])

  const previewSlug = useMemo(
    () => slugifyForStrategy(previewTitle, strategy),
    [previewTitle, strategy]
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setSaveSucceeded(false)
    const ok = await save(strategy)
    if (ok) {
      setSaveSucceeded(true)
    }
  }

  if (state.phase === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-content-secondary">
        <Spinner label="Loading SEO slug settings" className="gap-2" />
        <span>Loading slug strategy…</span>
      </div>
    )
  }

  if (state.phase === "error") {
    return (
      <div
        role="alert"
        className="rounded-lg border border-interactive-danger-subtle bg-surface-default p-4 shadow-sm"
      >
        <p className="text-sm font-medium text-content-danger">Unable to load SEO settings</p>
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
          Slug strategy saved. New product and category handles will use this ruleset.
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
          <h2 className="text-lg font-semibold text-content-primary">URL slug strategy</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Choose how Nordic letters are transliterated when generating handles. Nordic maps ø→oe,
            æ→ae, å→aa; Omit uses single ASCII letters.
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-content-primary">Strategy</legend>
          <label className="flex items-center gap-2 text-sm text-content-secondary">
            <input
              type="radio"
              name="slug_strategy"
              value="nordic"
              checked={strategy === "nordic"}
              disabled={isSaving}
              onChange={() => setStrategy("nordic")}
            />
            Nordic (ø→oe, æ→ae, å→aa)
          </label>
          <label className="flex items-center gap-2 text-sm text-content-secondary">
            <input
              type="radio"
              name="slug_strategy"
              value="omit"
              checked={strategy === "omit"}
              disabled={isSaving}
              onChange={() => setStrategy("omit")}
            />
            Omit diacritics (ø→o, æ→a, å→a)
          </label>
        </fieldset>

        <FormField label="Live preview" hint="Type a product title to preview the generated slug.">
          <Input
            value={previewTitle}
            disabled={isSaving}
            onChange={(e) => setPreviewTitle(e.target.value)}
          />
          <p className="mt-2 font-mono text-sm text-content-primary" aria-live="polite">
            /{previewSlug}
          </p>
        </FormField>

        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save strategy"}
        </Button>
      </Card>
    </form>
  )
}
