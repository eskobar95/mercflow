import type { ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { PlunkConnectorSettingsForm } from "@/components/connectors/plunk/PlunkConnectorSettingsForm"
import { PageHeader } from "@/components/ui/PageHeader"
import { usePlunkConnectorAdmin } from "@/hooks/usePlunkConnectorAdmin"

import { settingsConnectorBreadcrumbs } from "@/config/settingsBreadcrumbs"

export function PlunkConnectorPage(): ReactNode {
  const ctl = usePlunkConnectorAdmin()

  return (
    <div className="p-6">
      <PageHeader
        title="Plunk email"
        description="Configure transactional email defaults and validate connectivity straight from the MercFlow admin."
        breadcrumbs={settingsConnectorBreadcrumbs("Plunk email")}
      />

      {ctl.state.phase === "loading" ? (
        <div className="h-64 animate-pulse rounded-lg border border-border-subtle bg-surface-subtle" />
      ) : null}

      {ctl.state.phase === "error" ? (
        <div role="alert" className="rounded-lg border border-interactive-danger-subtle bg-surface-default p-4 shadow-sm">
          <p className="text-sm font-semibold text-content-danger">Unable to load Plunk</p>
          <p className="mt-2 text-sm text-content-secondary">{ctl.state.message}</p>
          <Button variant="secondary" type="button" onClick={() => void ctl.reload()}>
            Retry
          </Button>
        </div>
      ) : null}

      {ctl.operationalError !== null ? (
        <div role="alert" className="mb-4 rounded-lg border border-feedback-danger-border bg-feedback-danger-subtle p-4 text-feedback-danger-content shadow-sm">
          <p className="text-sm font-medium">{ctl.operationalError}</p>
        </div>
      ) : null}

      {ctl.lastProbe !== null ? (
        <output
          className={`mb-4 block rounded-lg border p-4 text-sm shadow-sm ${
            ctl.lastProbe.success
              ? "border-feedback-success-border bg-feedback-success-subtle text-feedback-success-content"
              : "border-feedback-danger-border bg-feedback-danger-subtle text-feedback-danger-content"
          }`}
        >
          {ctl.lastProbe.message}
        </output>
      ) : null}

      {ctl.state.phase === "ready" ? (
        <PlunkConnectorSettingsForm
          dto={ctl.state.dto}
          saving={ctl.saving}
          testing={ctl.testing}
          onSubmit={(patch) => ctl.save(patch)}
          onProbe={(body) => ctl.probe(body)}
        />
      ) : null}
    </div>
  )
}
