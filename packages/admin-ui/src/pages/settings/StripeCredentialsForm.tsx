import type { Dispatch, ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Spinner } from "@/components/ui/Spinner"
import type { PaymentProviderDto } from "@/features/payments/paymentProvidersApi"

import type { CredentialTab, PaymentsSettingsAction, SaveState } from "./paymentsSettingsState"

function credentialTabButtonClass(isActive: boolean): string {
  return `border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "border-interactive-primary text-content-primary"
      : "border-transparent text-content-secondary hover:text-content-primary"
  }`
}

type StripeCredentialsFormProps = {
  config: PaymentProviderDto
  activeTab: CredentialTab
  testSecretInput: string
  testPublishInput: string
  testWebhookInput: string
  liveSecretInput: string
  livePublishInput: string
  liveWebhookInput: string
  saveState: SaveState
  dispatch: Dispatch<PaymentsSettingsAction>
  onSave: () => void
}

export function StripeCredentialsForm({
  config,
  activeTab,
  testSecretInput,
  testPublishInput,
  testWebhookInput,
  liveSecretInput,
  livePublishInput,
  liveWebhookInput,
  saveState,
  dispatch,
  onSave,
}: StripeCredentialsFormProps): ReactNode {
  const isTest = activeTab === "test"
  const secretInput = isTest ? testSecretInput : liveSecretInput
  const publishInput = isTest ? testPublishInput : livePublishInput
  const webhookInput = isTest ? testWebhookInput : liveWebhookInput
  const hasSecretKey = isTest ? config.test_has_secret_key : config.live_has_secret_key
  const hasWebhookSecret = isTest ? config.test_has_webhook_secret : config.live_has_webhook_secret
  const savedPublishable = isTest ? config.test_publishable_key : config.live_publishable_key

  return (
    <Card className="p-6 lg:p-8">
      <div
        role="tablist"
        aria-label="Stripe credential environment"
        className="flex flex-wrap gap-1 border-b border-border-subtle"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "test"}
          className={credentialTabButtonClass(activeTab === "test")}
          onClick={() => {
            dispatch({ type: "setActiveTab", tab: "test" })
          }}
        >
          Test
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "live"}
          className={credentialTabButtonClass(activeTab === "live")}
          onClick={() => {
            dispatch({ type: "setActiveTab", tab: "live" })
          }}
        >
          Live
        </button>
      </div>

      <p className="mt-6 max-w-prose text-sm text-content-secondary">
        Secret keys encrypt at rest with{" "}
        <code className="text-xs text-content-tertiary">MERCFLOW_ENCRYPTION_KEY</code>. Leave a
        secret field blank to keep the saved value.
      </p>

      <div className="mt-6 grid gap-5" role="tabpanel">
        <FormField
          label="Secret key"
          htmlFor={`stripe-${activeTab}-sk`}
          hint={hasSecretKey ? "A secret key is saved for this environment" : undefined}
        >
          <Input
            id={`stripe-${activeTab}-sk`}
            type="password"
            autoComplete="off"
            value={secretInput}
            placeholder={hasSecretKey ? "••••••••••••••••" : isTest ? "sk_test_..." : "sk_live_..."}
            onChange={(event) => {
              dispatch({
                type: isTest ? "setTestSecretInput" : "setLiveSecretInput",
                value: event.target.value,
              })
            }}
          />
        </FormField>

        <FormField
          label="Publishable key"
          htmlFor={`stripe-${activeTab}-pk`}
          hint={savedPublishable ?? undefined}
        >
          <Input
            id={`stripe-${activeTab}-pk`}
            type="text"
            autoComplete="off"
            value={publishInput}
            placeholder={isTest ? "pk_test_..." : "pk_live_..."}
            onChange={(event) => {
              dispatch({
                type: isTest ? "setTestPublishInput" : "setLivePublishInput",
                value: event.target.value,
              })
            }}
          />
        </FormField>

        <FormField
          label="Webhook signing secret"
          htmlFor={`stripe-${activeTab}-wh`}
          hint={hasWebhookSecret ? "A webhook secret is saved for this environment" : undefined}
        >
          <Input
            id={`stripe-${activeTab}-wh`}
            type="password"
            autoComplete="off"
            value={webhookInput}
            placeholder={hasWebhookSecret ? "••••••••••••••••" : "whsec_..."}
            onChange={(event) => {
              dispatch({
                type: isTest ? "setTestWebhookInput" : "setLiveWebhookInput",
                value: event.target.value,
              })
            }}
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

        <div>
          <Button
            type="button"
            variant="primary"
            shape="pill"
            disabled={saveState.status === "saving"}
            onClick={onSave}
          >
            {saveState.status === "saving" ? (
              <span className="inline-flex items-center gap-2">
                <Spinner label="" className="h-4 w-4" />
                Saving…
              </span>
            ) : (
              `Save ${isTest ? "test" : "live"} credentials`
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
