import { useEffect, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Spinner } from "@/components/ui/Spinner"
import {
  GTM_CONTAINER_ID_INPUT_PATTERN,
  normalizeGtmContainerIdInput,
} from "@/features/connectors/gtmValidation"
import { useGtmConnectorSettings } from "@/hooks/useGtmConnectorSettings"

export function GtmConnectorSettingsForm(): JSX.Element {
  const { state, reload, save } = useGtmConnectorSettings()
  const [value, setValue] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const [saveSucceeded, setSaveSucceeded] = useState(false)

  useEffect(() => {
    if (state.phase === "ready") {
      setValue(state.container_id ?? "")
      setLocalError(null)
      return
    }
    if (state.phase === "save_error") {
      setValue(state.container_id ?? "")
    }
  }, [state])

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault()
    setSaveSucceeded(false)
    const normalized = normalizeGtmContainerIdInput(value)

    if (normalized !== "" && !GTM_CONTAINER_ID_INPUT_PATTERN.test(normalized)) {
      setLocalError(
        "Use uppercase GTM- followed by alphanumeric characters (example: GTM-ABC123)."
      )
      return
    }

    if (normalized === "") {
      setLocalError(
        "Container ID cannot be blank. Paste the identifier from Tag Manager exactly as shown."
      )
      return
    }

    setLocalError(null)

    const ok = await save(normalized)
    if (ok) {
      setSaveSucceeded(true)
    }
  }

  if (state.phase === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-content-secondary">
        <Spinner label="Loading GTM connector settings" className="gap-2" />
        <span>Loading Google Tag Manager settings…</span>
      </div>
    )
  }

  if (state.phase === "error") {
    return (
      <div
        role="alert"
        className="rounded-lg border border-interactive-danger-subtle bg-surface-default p-4 shadow-sm"
      >
        <p className="text-sm font-medium text-content-danger">
          Unable to reach the connector service
        </p>
        <p className="mt-2 text-sm text-content-secondary">{state.message}</p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => void reload()}
        >
          Retry
        </Button>
      </div>
    )
  }

  let bannerRole: "status" | "alert" = "status"
  let bannerClass =
    "rounded-lg border border-border-subtle bg-surface-subtle p-3 text-sm text-content-secondary"
  let bannerMessage: string | null = saveSucceeded
    ? "Container ID saved to the store connector record."
    : null

  if (state.phase === "save_error") {
    bannerRole = "alert"
    bannerClass =
      "rounded-lg border border-interactive-danger-subtle bg-surface-default p-3 text-sm text-content-danger"
    bannerMessage = state.message
  } else if (localError !== null) {
    bannerRole = "alert"
    bannerClass =
      "rounded-lg border border-interactive-danger-subtle bg-surface-default p-3 text-sm text-content-danger"
    bannerMessage = localError
  }

  const isSaving = state.phase === "saving"

  return (
    <form className="space-y-6" onSubmit={(e) => void handleSubmit(e)} noValidate>
      {bannerMessage !== null ? (
        <div role={bannerRole} className={bannerClass}>
          {bannerMessage}
        </div>
      ) : null}

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-content-primary">
            Google Tag Manager
          </h2>
          <p className="mt-1 text-sm text-content-secondary">
            Paste the Container ID copied from Tag Manager (<code>GTM-</code>
            ). The storefront reads it via the public connector endpoint—no storefront environment
            variable is required for this identifier.
          </p>
        </div>

        <FormField
          label="Google Tag Manager container ID"
          hint="Letters after GTM- are case-insensitive; values are normalized to uppercase."
          required={false}
        >
          <Input
            autoComplete="off"
            spellCheck={false}
            value={value}
            disabled={isSaving}
            onChange={(e) => {
              setSaveSucceeded(false)
              setValue(e.target.value)
            }}
          />
        </FormField>

        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save container ID"}
          </Button>
        </div>
      </Card>
    </form>
  )
}
