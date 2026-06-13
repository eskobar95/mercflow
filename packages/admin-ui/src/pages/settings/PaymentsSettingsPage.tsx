import type { ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { PageHeader } from "@/components/ui/PageHeader"
import { Spinner } from "@/components/ui/Spinner"
import { Switch } from "@/components/ui/Switch"
import { resolvePaymentStatusBadge } from "@/features/payments/paymentProvidersApi"

import { settingsPaymentsBreadcrumbs } from "@/config/settingsBreadcrumbs"

import { PaymentsLiveModeDialog } from "./PaymentsLiveModeDialog"
import { PaymentsWebhookUrlCard } from "./PaymentsWebhookUrlCard"
import { StripeCredentialsForm } from "./StripeCredentialsForm"
import { usePaymentsSettingsPage } from "./usePaymentsSettingsPage"

export function PaymentsSettingsPage(): ReactNode {
  const {
    hasBackend,
    state,
    dispatch,
    reload,
    handleSave,
    handleActivateLiveMode,
    handleSwitchToTestMode,
  } = usePaymentsSettingsPage()

  const {
    phase,
    message,
    config,
    activeTab,
    testSecretInput,
    testPublishInput,
    testWebhookInput,
    liveSecretInput,
    livePublishInput,
    liveWebhookInput,
    saveState,
    modeDialogOpen,
    modeSwitchState,
    storefrontUrl,
  } = state

  if (!hasBackend) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">
          Configure{" "}
          <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code> to
          manage payment settings.
        </p>
      </div>
    )
  }

  if (phase === "loading" || phase === "idle") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8" aria-busy aria-live="polite">
        <Spinner label="Loading payment settings" />
      </div>
    )
  }

  if (phase === "error" || config === null) {
    return (
      <div className="p-6" role="alert">
        <PageHeader title="Payments" breadcrumbs={settingsPaymentsBreadcrumbs()} />
        <Card className="mt-6 p-6">
          <p className="font-medium text-content-primary">Could not reach the backend.</p>
          <p className="mt-2 text-sm text-content-secondary">{message}</p>
          <Button type="button" variant="secondary" className="mt-6" onClick={() => void reload()}>
            Try again
          </Button>
        </Card>
      </div>
    )
  }

  const statusBadge = resolvePaymentStatusBadge(config)
  const isLiveMode = config.mode === "live"

  return (
    <div className="pb-24">
      <PageHeader
        title="Payments"
        description="Connect Stripe for checkout, subscriptions, and webhooks. Manage separate test and live credentials."
        breadcrumbs={settingsPaymentsBreadcrumbs()}
        actions={
          <Badge variant={statusBadge.variant} dot>
            {statusBadge.label}
          </Badge>
        }
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:max-w-5xl lg:gap-12">
        <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
          <div>
            <h2 className="text-lg font-semibold text-content-primary">Stripe</h2>
            <p className="mt-1 text-sm text-content-secondary">
              {isLiveMode
                ? "Live mode is active — real charges use your live credentials."
                : "Test mode is active — use Stripe test keys while configuring."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-content-secondary" id="payments-mode-label">
              Live mode
            </span>
            <Switch
              checked={isLiveMode}
              aria-labelledby="payments-mode-label"
              disabled={modeSwitchState.status === "switching"}
              onCheckedChange={(checked) => {
                if (checked) {
                  dispatch({ type: "setModeDialogOpen", open: true })
                  return
                }
                void handleSwitchToTestMode()
              }}
            />
          </div>
        </Card>

        <StripeCredentialsForm
          config={config}
          activeTab={activeTab}
          testSecretInput={testSecretInput}
          testPublishInput={testPublishInput}
          testWebhookInput={testWebhookInput}
          liveSecretInput={liveSecretInput}
          livePublishInput={livePublishInput}
          liveWebhookInput={liveWebhookInput}
          saveState={saveState}
          dispatch={dispatch}
          onSave={() => {
            void handleSave()
          }}
        />

        <PaymentsWebhookUrlCard storefrontUrl={storefrontUrl} />
      </div>

      <PaymentsLiveModeDialog
        open={modeDialogOpen}
        modeSwitchState={modeSwitchState}
        onOpenChange={(open) => {
          dispatch({ type: "setModeDialogOpen", open })
        }}
        onConfirm={() => {
          void handleActivateLiveMode()
        }}
      />
    </div>
  )
}
