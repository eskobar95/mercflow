import type { Dispatch, ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Spinner } from "@/components/ui/Spinner"
import type { StripeConnectorDetailDto } from "@/features/connectors/stripeConnectorApi"

import type { StripeConnectorSettingsAction, StripeSaveState, StripeTestState } from "./stripeConnectorSettingsState"

type StripeApiKeysCardProps = {
  baseHintId: string
  detail: StripeConnectorDetailDto | null
  secretInput: string
  publishInput: string
  webhookInput: string
  saveState: StripeSaveState
  testState: StripeTestState
  dispatch: Dispatch<StripeConnectorSettingsAction>
  onSaveCredentials: () => void
  onTest: () => void
}

export function StripeApiKeysCard({
  baseHintId,
  detail,
  secretInput,
  publishInput,
  webhookInput,
  saveState,
  testState,
  dispatch,
  onSaveCredentials,
  onTest,
}: StripeApiKeysCardProps): ReactNode {
  return (
    <Card className="p-6 lg:p-8">
      <h2 className="text-lg font-semibold text-content-primary">Stripe API keys</h2>
      <p id={baseHintId} className="mt-2 max-w-prose text-sm text-content-secondary">
        Keys encrypt at rest with <code className="text-xs text-content-tertiary">MERCFLOW_CONNECTOR_ENCRYPTION_KEY</code>.
        Leaving a field blank keeps the saved value unless you are finishing first-time setup — then both Stripe secret +
        publishable keys are required.
      </p>
      <div className="mt-6 grid gap-5">
        <FormField
          label="Stripe secret key"
          htmlFor="stripe-sk"
          hint={detail?.secret_key_masked ?? undefined}
        >
          <Input
            id="stripe-sk"
            type="password"
            autoComplete="off"
            value={secretInput}
            placeholder={detail?.secret_key_masked ?? "sk_live_..."}
            onChange={(evt) => {
              dispatch({ type: "setSecretInput", value: evt.target.value })
            }}
          />
        </FormField>

        <FormField
          label="Publishable key"
          htmlFor="stripe-pk"
          hint={detail?.publishable_key_masked ?? undefined}
        >
          <Input
            id="stripe-pk"
            type="password"
            autoComplete="off"
            value={publishInput}
            placeholder={detail?.publishable_key_masked ?? "pk_live_..."}
            onChange={(evt) => dispatch({ type: "setPublishInput", value: evt.target.value })}
          />
        </FormField>

        <FormField label="Webhook signing secret" htmlFor="stripe-wh" hint={detail?.webhook_secret_masked ?? undefined}>
          <Input
            id="stripe-wh"
            type="password"
            autoComplete="off"
            value={webhookInput}
            placeholder={detail?.webhook_secret_masked ?? "whsec_..."}
            onChange={(evt) => dispatch({ type: "setWebhookInput", value: evt.target.value })}
          />
        </FormField>

        {saveState.status === "error" ? (
          <p role="alert" className="text-sm text-feedback-danger-content">
            {saveState.message}
          </p>
        ) : null}
        {saveState.status === "success" ? (
          <p className="text-sm text-feedback-success-content" aria-live="polite">
            {saveState.message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="primary"
            shape="default"
            onClick={onSaveCredentials}
            disabled={saveState.status === "working"}
            leadingIcon={saveState.status === "working" ? <Spinner size="sm" label="Saving" /> : undefined}
          >
            Save connector
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={onTest}
            disabled={detail?.configured !== true || testState.status === "working"}
            leadingIcon={testState.status === "working" ? <Spinner size="sm" label="Testing" /> : undefined}
          >
            Test connection
          </Button>
          {testState.status === "error" ? (
            <p className="w-full text-sm text-feedback-danger-content" role="alert">
              {testState.message}
            </p>
          ) : null}
          {testState.status === "success" ? (
            <p className="w-full text-sm text-feedback-success-content" aria-live="polite">
              {testState.message}
              {detail?.last_tested_at !== null &&
              detail?.last_tested_at !== undefined &&
              detail.last_tested_at !== ""
                ? ` — last handshake ${detail.last_tested_at}`
                : null}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
