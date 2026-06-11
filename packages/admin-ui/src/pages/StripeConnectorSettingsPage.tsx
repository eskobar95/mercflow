import { type ReactNode, useId } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { PageHeader } from "@/components/ui/PageHeader"
import { Spinner } from "@/components/ui/Spinner"
import { settingsConnectorBreadcrumbs } from "@/config/settingsBreadcrumbs"
import { SETTINGS_PATHS } from "@/config/settingsSections"
import { CONNECTOR_CATALOG } from "@/features/connectors/connectorsCatalog"

import { StripeApiKeysCard } from "./StripeApiKeysCard"
import { StripePaymentsTable } from "./StripePaymentsTable"
import { StripeSyncCard } from "./StripeSyncCard"
import { StripeVatBehaviourCard } from "./StripeVatBehaviourCard"
import { useStripeConnectorSettingsPage } from "./useStripeConnectorSettingsPage"

export function StripeConnectorSettingsPage(): ReactNode {
  const baseHintId = useId()
  const {
    state,
    dispatch,
    refreshStripeData,
    handleSaveCredentials,
    handleTest,
    handleSync,
    handleVatChange,
  } = useStripeConnectorSettingsPage()

  const {
    loadState,
    detail,
    payments,
    secretInput,
    publishInput,
    webhookInput,
    saveState,
    testState,
    syncState,
    vatSaving,
    vatError,
  } = state

  if (loadState.status === "loading" || loadState.status === "idle") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8" aria-busy aria-live="polite">
        <div className="flex flex-col items-center gap-3 text-center text-sm text-content-secondary">
          <Spinner label="Loading Stripe connector settings" />
        </div>
      </div>
    )
  }

  if (loadState.status === "error") {
    return (
      <div className="p-6" role="alert">
        <PageHeader
          title="Stripe"
          breadcrumbs={settingsConnectorBreadcrumbs("Stripe")}
        />
        <Card className="mt-6 p-6">
          <p className="font-medium text-content-primary">Could not reach the backend.</p>
          <p className="mt-2 text-sm text-content-secondary">{loadState.message}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" shape="pill" type="button" onClick={() => void refreshStripeData()}>
              Try again
            </Button>
            <Link
              className="inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold text-content-secondary hover:text-content-primary"
              to={SETTINGS_PATHS.root}
            >
              Back to settings
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const stripeCatalog = CONNECTOR_CATALOG.stripe
  const vatValue = detail?.vat_mode ?? "inclusive"

  return (
    <div className="pb-24">
      <PageHeader
        title={stripeCatalog.name}
        description={stripeCatalog.description}
        breadcrumbs={settingsConnectorBreadcrumbs(stripeCatalog.name)}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:max-w-5xl lg:gap-12">
        <StripeApiKeysCard
          baseHintId={baseHintId}
          detail={detail}
          secretInput={secretInput}
          publishInput={publishInput}
          webhookInput={webhookInput}
          saveState={saveState}
          testState={testState}
          dispatch={dispatch}
          onSaveCredentials={() => void handleSaveCredentials()}
          onTest={() => void handleTest()}
        />

        <StripeVatBehaviourCard
          detail={detail}
          vatValue={vatValue}
          vatSaving={vatSaving}
          vatError={vatError}
          onVatChange={(value) => void handleVatChange(value)}
        />

        <StripeSyncCard
          detail={detail}
          syncState={syncState}
          onSync={() => void handleSync()}
        />

        <StripePaymentsTable payments={payments} />

        <div className="flex gap-4">
          <Link
            className="text-sm font-semibold text-interactive-primary underline-offset-2 hover:underline"
            to={SETTINGS_PATHS.root}
          >
            ← Back to settings
          </Link>
        </div>
      </div>
    </div>
  )
}
