import type { FormEventHandler } from "react"
import { useEffect, useState } from "react"

import { ConnectorConnectionBadge } from "@/components/connectors/ConnectorConnectionBadge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Checkbox } from "@/components/ui/Checkbox"
import { Input } from "@/components/ui/Input"
import type { PlunkConnectorAdminDto } from "@/features/connectors/parsePlunkConnectorResponse"
import type { PatchPlunkConnectorPayload } from "@/features/connectors/plunkConnectorAdminApi"

export type PlunkConnectorSettingsFormProps = {
  dto: PlunkConnectorAdminDto
  saving: boolean
  testing: boolean
  onSubmit: (payload: PatchPlunkConnectorPayload) => Promise<void>
  onProbe: (payload: { test_email?: string }) => Promise<void>
}

export function PlunkConnectorSettingsForm({
  dto,
  saving,
  testing,
  onSubmit,
  onProbe,
}: PlunkConnectorSettingsFormProps): JSX.Element {
  const [apiKeyDraft, setApiKeyDraft] = useState<string>("")
  const [fromEmail, setFromEmail] = useState<string>(dto.fromEmail ?? "")
  const [fromName, setFromName] = useState<string>(dto.fromName ?? "")
  const [active, setActive] = useState<boolean>(dto.active)
  const [testEmail, setTestEmail] = useState<string>("")
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    setFromEmail(dto.fromEmail ?? "")
    setFromName(dto.fromName ?? "")
    setActive(dto.active)
  }, [dto.active, dto.configured, dto.fromEmail, dto.fromName])

  useEffect(() => {
    setApiKeyDraft("")
    setLocalError(null)
  }, [dto.apiKeyMasked, dto.configured, dto.connectionHealth, dto.lastTestedAt])

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (evt) => {
    evt.preventDefault()
    setLocalError(null)

    const payload: PatchPlunkConnectorPayload = {
      active,
      from_email: fromEmail.trim() === "" ? null : fromEmail.trim(),
      from_name: fromName.trim() === "" ? null : fromName.trim(),
    }

    const trimmedKey = apiKeyDraft.trim()
    if (trimmedKey !== "") {
      payload.api_key = trimmedKey
    }

    if (!dto.configured && trimmedKey === "") {
      setLocalError("Add your Plunk secret API key to finish configuration.")
      return
    }

    try {
      await onSubmit(payload)
      setApiKeyDraft("")
    } catch {
      /* surfaced by parent banner */
    }
  }

  const handleProbeClick = async (): Promise<void> => {
    setLocalError(null)
    const trimmed = testEmail.trim()
    await onProbe(trimmed !== "" ? { test_email: trimmed } : {})
  }

  return (
    <form className="flex flex-col gap-6" noValidate onSubmit={handleSubmit}>
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-content-primary">Deliverability defaults</h2>
            <p className="text-sm text-content-secondary">
              Stored encrypted in <code className="text-xs">connector_config</code> when you save — no
              more silent failures from missing backend env vars.
            </p>
          </div>
          {dto.configured && dto.connectionHealth !== null ? (
            <ConnectorConnectionBadge health={dto.connectionHealth} />
          ) : null}
        </div>

        {dto.lastTestMessage !== null ? (
          <p className="text-sm text-content-secondary">
            Last test note:{" "}
            <span className="text-content-primary">{dto.lastTestMessage}</span>
          </p>
        ) : null}

        {dto.lastTestedAt !== null ? (
          <p className="text-xs text-content-tertiary">
            Last tested{" "}
            <time dateTime={dto.lastTestedAt}>{new Date(dto.lastTestedAt).toLocaleString()}</time>
          </p>
        ) : (
          <p className="text-xs text-content-tertiary">No successful connection test logged yet.</p>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="plunk-api-key" className="text-sm font-medium text-content-primary">
            Secret API key
          </label>
          <Input
            id="plunk-api-key"
            name="plunk-api-key"
            type="password"
            autoComplete="off"
            value={apiKeyDraft}
            placeholder={dto.apiKeyMasked ? "Leave blank to keep the saved key." : "sk_..."}
            onChange={(evt) => setApiKeyDraft(evt.target.value)}
          />
          {dto.apiKeyMasked ? (
            <p className="text-xs text-content-tertiary">
              Currently stored as <span className="font-mono text-content-secondary">{dto.apiKeyMasked}</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="plunk-from-email" className="text-sm font-medium text-content-primary">
            From email
          </label>
          <Input
            id="plunk-from-email"
            name="plunk-from-email"
            type="email"
            autoComplete="off"
            value={fromEmail}
            onChange={(evt) => setFromEmail(evt.target.value)}
            placeholder="hello@yourdomain.com"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="plunk-from-name" className="text-sm font-medium text-content-primary">
            From name
          </label>
          <Input
            id="plunk-from-name"
            name="plunk-from-name"
            type="text"
            value={fromName}
            onChange={(evt) => setFromName(evt.target.value)}
            placeholder="Your store"
          />
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="plunk-active"
            checked={active}
            onCheckedChange={(state) => setActive(state === true)}
            label="Enable Plunk for outbound email"
          />
        </div>

        {localError !== null ? (
          <p role="alert" className="text-sm text-content-danger">
            {localError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary" disabled={saving || testing}>
            {saving ? "Saving…" : "Save credentials"}
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-content-primary">Connection test</h2>
          <p className="text-sm text-content-secondary">
            Default check calls <code className="text-xs">POST /v1/track</code> without sending email. Add a
            recipient below to exercise <code className="text-xs">POST /v1/send</code> end-to-end.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="plunk-test-email" className="text-sm font-medium text-content-primary">
            Optional test recipient
          </label>
          <Input
            id="plunk-test-email"
            name="plunk-test-email"
            type="email"
            value={testEmail}
            onChange={(evt) => setTestEmail(evt.target.value)}
            placeholder="you@example.com"
            disabled={!dto.configured || testing || saving}
          />
        </div>

        <div>
          <Button
            type="button"
            variant="secondary"
            disabled={!dto.configured || testing || saving}
            onClick={() => void handleProbeClick()}
          >
            {testing ? "Testing…" : "Run connection test"}
          </Button>
        </div>
      </Card>
    </form>
  )
}
