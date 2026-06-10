import { type ReactNode } from "react"
import { Link } from "react-router-dom"

import { ShipmondoShippingRulesSection } from "@/components/connectors/shipmondo/ShipmondoShippingRulesSection"

import { ShipmondoCredentialsCard } from "./ShipmondoCredentialsCard"
import { ShipmondoRecentTestsCard } from "./ShipmondoRecentTestsCard"
import { ShipmondoSenderSettingsSection } from "./ShipmondoSenderSettingsSection"
import { formatLastTestedAt } from "./shipmondoWorkspaceState"
import { useShipmondoConnectorWorkspace } from "./useShipmondoConnectorWorkspace"

/**
 * Full-page workspace for configuring the Shipmondo connector (credentials, activation, probes).
 */
export function ShipmondoConnectorWorkspace(): ReactNode {
  const {
    snapshot,
    isLoading,
    isError,
    error,
    patch,
    test,
    configured,
    ui,
    dispatch,
    handleSave,
    handleTest,
  } = useShipmondoConnectorWorkspace()

  const { draftActive, draftApiUser, draftApiKey, draftModuleKey, formError, testBanner } = ui

  return (
    <div className="p-6">
      <Link
        to="/settings/connectors"
        className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
      >
        ← Connectors
      </Link>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
          Integrations
        </p>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-content-primary">Shipmondo</h1>
            <p className="max-w-2xl text-sm text-content-secondary">
              Store your Shipmondo API credentials securely, control whether rates are exposed to
              shoppers, and probe the live API without leaving the admin.
            </p>
          </div>
          <div className="text-sm text-content-secondary">
            <p>
              Last probe:{" "}
              <span className="font-medium text-content-primary">
                {snapshot ? formatLastTestedAt(snapshot.lastTestedAt) : "—"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 h-64 animate-pulse rounded-md border border-border-subtle bg-surface-subtle" />
      ) : null}

      {isError ? (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-interactive-danger-subtle bg-surface-default p-4 text-sm text-content-danger shadow-sm"
        >
          <p className="font-medium">Could not load Shipmondo settings</p>
          <p className="mt-1 text-content-secondary">
            {error instanceof Error
              ? error.message
              : "Unexpected error while contacting the backend."}
          </p>
        </div>
      ) : null}

      {snapshot !== null && !isLoading && !isError ? (
        <div className="mt-8 space-y-6">
          <ShipmondoCredentialsCard
            snapshot={snapshot}
            configured={configured}
            draftActive={draftActive}
            draftApiUser={draftApiUser}
            draftApiKey={draftApiKey}
            draftModuleKey={draftModuleKey}
            formError={formError}
            patchIsPending={patch.isPending}
            patchError={patch.isError && patch.error instanceof Error ? patch.error : null}
            testIsPending={test.isPending}
            dispatch={dispatch}
            onSave={handleSave}
            onTest={handleTest}
          />

          <ShipmondoShippingRulesSection
            configured={configured}
            shippingRules={snapshot.shippingRules}
          />

          <ShipmondoSenderSettingsSection
            configured={configured}
            labelSettings={snapshot.labelSettings}
          />

          {testBanner ? (
            <output
              className={
                testBanner.tone === "success"
                  ? "block rounded-md border border-feedback-success-subtle bg-feedback-success-subtle/40 px-4 py-3 text-sm text-feedback-success-content"
                  : "block rounded-md border border-feedback-danger-subtle bg-feedback-danger-subtle/40 px-4 py-3 text-sm text-feedback-danger-content"
              }
            >
              {testBanner.message}
            </output>
          ) : null}

          <ShipmondoRecentTestsCard recentLogs={snapshot.recentLogs} />
        </div>
      ) : null}
    </div>
  )
}
