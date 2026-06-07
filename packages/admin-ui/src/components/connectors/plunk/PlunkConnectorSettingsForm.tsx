import type { FormEventHandler } from "react"
import { type ReactNode, useReducer } from "react"

import { ConnectorConnectionBadge } from "@/components/connectors/ConnectorConnectionBadge"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Checkbox } from "@/components/ui/Checkbox"
import { Input } from "@/components/ui/Input"
import type { PlunkConnectorAdminDto } from "@/features/connectors/parsePlunkConnectorResponse"
import type { PatchPlunkConnectorPayload } from "@/features/connectors/plunkConnectorAdminApi"

type PlunkConnectorSettingsFormProps = {
  dto: PlunkConnectorAdminDto
  saving: boolean
  testing: boolean
  onSubmit: (payload: PatchPlunkConnectorPayload) => Promise<void>
  onProbe: (payload: { test_email?: string }) => Promise<void>
}

type PlunkFormState = {
  apiKeyDraft: string
  fromEmail: string
  fromName: string
  active: boolean
  testEmail: string
  localError: string | null
}

type PlunkFormAction =
  | { type: "setApiKeyDraft"; value: string }
  | { type: "setFromEmail"; value: string }
  | { type: "setFromName"; value: string }
  | { type: "setActive"; value: boolean }
  | { type: "setTestEmail"; value: string }
  | { type: "setLocalError"; value: string | null }
  | { type: "syncDeliverability"; fromEmail: string; fromName: string; active: boolean }
  | { type: "resetSecrets" }

const INITIAL_PLUNK_FORM_STATE: PlunkFormState = {
  apiKeyDraft: "",
  fromEmail: "",
  fromName: "",
  active: false,
  testEmail: "",
  localError: null,
}

function plunkFormReducer(state: PlunkFormState, action: PlunkFormAction): PlunkFormState {
  switch (action.type) {
    case "setApiKeyDraft":
      return { ...state, apiKeyDraft: action.value }
    case "setFromEmail":
      return { ...state, fromEmail: action.value }
    case "setFromName":
      return { ...state, fromName: action.value }
    case "setActive":
      return { ...state, active: action.value }
    case "setTestEmail":
      return { ...state, testEmail: action.value }
    case "setLocalError":
      return { ...state, localError: action.value }
    case "syncDeliverability":
      return {
        ...state,
        fromEmail: action.fromEmail,
        fromName: action.fromName,
        active: action.active,
      }
    case "resetSecrets":
      return { ...state, apiKeyDraft: "", localError: null }
    default:
      return state
  }
}

export function PlunkConnectorSettingsForm({
  dto,
  saving,
  testing,
  onSubmit,
  onProbe,
}: PlunkConnectorSettingsFormProps): ReactNode {
  const [form, dispatch] = useReducer(plunkFormReducer, INITIAL_PLUNK_FORM_STATE)
  const { apiKeyDraft, fromEmail, fromName, active, testEmail, localError } = form

  useAdjustStateWhenKeyChanges(
    `${dto.active}\u0000${dto.fromEmail ?? ""}\u0000${dto.fromName ?? ""}`,
    () => {
      dispatch({
        type: "syncDeliverability",
        fromEmail: dto.fromEmail ?? "",
        fromName: dto.fromName ?? "",
        active: dto.active,
      })
    },
  )

  useAdjustStateWhenKeyChanges(
    `${dto.apiKeyMasked ?? ""}\u0000${dto.configured}\u0000${dto.connectionHealth ?? ""}\u0000${dto.lastTestedAt ?? ""}`,
    () => {
      dispatch({ type: "resetSecrets" })
    },
  )

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (evt) => {
    evt.preventDefault()
    dispatch({ type: "setLocalError", value: null })

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
      dispatch({
        type: "setLocalError",
        value: "Add your Plunk secret API key to finish configuration.",
      })
      return
    }

    try {
      await onSubmit(payload)
      dispatch({ type: "setApiKeyDraft", value: "" })
    } catch {
      /* surfaced by parent banner */
    }
  }

  const handleProbeClick = async (): Promise<void> => {
    dispatch({ type: "setLocalError", value: null })
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
          <p className="text-xs text-content-tertiary">No connection test recorded yet.</p>
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
            onChange={(evt) => dispatch({ type: "setApiKeyDraft", value: evt.target.value })}
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
            onChange={(evt) => dispatch({ type: "setFromEmail", value: evt.target.value })}
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
            onChange={(evt) => dispatch({ type: "setFromName", value: evt.target.value })}
            placeholder="Your store"
          />
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="plunk-active"
            checked={active}
            onCheckedChange={(state) => dispatch({ type: "setActive", value: state === true })}
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
            onChange={(evt) => dispatch({ type: "setTestEmail", value: evt.target.value })}
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
