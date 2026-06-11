import type { ReactNode } from "react"

import { DnsRecordsTable } from "@/components/notifications/DnsRecordsTable"
import { SesDomainStatusBadge } from "@/components/notifications/SesDomainStatusBadge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Spinner } from "@/components/ui/Spinner"

import { useEmailDomainTab } from "./useEmailDomainTab"

export function EmailDomainTab(): ReactNode {
  const { state, reload, setDomainInput, setupDomain, domainLocked, showFallbackInfo } =
    useEmailDomainTab()
  const {
    phase,
    message,
    domainInput,
    configuredDomain,
    status,
    records,
    fallbackFrom,
    settingUp,
    setupError,
    pollingError,
  } = state

  if (phase === "loading") {
    return <Spinner label="Loading email domain settings" />
  }

  if (phase === "error") {
    return (
      <div role="alert" className="rounded-lg border border-interactive-danger-subtle p-4">
        <p className="text-sm text-content-danger">{message}</p>
        <Button type="button" variant="secondary" className="mt-4" onClick={() => void reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showFallbackInfo ? (
        <aside className="rounded-lg border border-feedback-warning-border bg-feedback-warning-subtle p-4 text-sm text-content-primary">
          Emails send from{" "}
          <span className="font-medium">{fallbackFrom}</span> until your domain is verified.
        </aside>
      ) : null}

      <Card className="space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-content-primary">Sending domain</h2>
            <p className="mt-1 text-sm text-content-secondary">
              Register your domain with Amazon SES and add the DNS records below at your DNS
              provider.
            </p>
          </div>
          {configuredDomain !== null ? <SesDomainStatusBadge status={status} /> : null}
        </div>

        <FormField
          label="Domain"
          htmlFor="email-domain-input"
          hint={
            domainLocked
              ? "Domain cannot be changed after setup. Contact support if you need to switch."
              : "Example: guapo.dk"
          }
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Input
              id="email-domain-input"
              value={domainInput}
              disabled={domainLocked || settingUp}
              placeholder="your-store.com"
              onChange={(event) => {
                setDomainInput(event.target.value)
              }}
            />
            {!domainLocked ? (
              <Button
                type="button"
                variant="primary"
                disabled={settingUp || domainInput.trim() === ""}
                onClick={() => {
                  void setupDomain()
                }}
              >
                {settingUp ? "Setting up…" : "Setup domain"}
              </Button>
            ) : null}
          </div>
        </FormField>

        {setupError !== null ? (
          <p role="alert" className="text-sm text-content-danger">
            {setupError}
          </p>
        ) : null}
        {pollingError !== null ? (
          <p role="alert" className="text-sm text-content-danger">
            {pollingError}
          </p>
        ) : null}

        {status === "verified" && configuredDomain !== null ? (
          <p className="text-sm text-feedback-success-content">
            Domain verified —{" "}
            <span className="font-medium">noreply@{configuredDomain}</span> is now your sending
            address.
          </p>
        ) : null}
      </Card>

      {records.length > 0 ? (
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold text-content-primary">DNS records</h2>
            <p className="mt-1 text-sm text-content-secondary">
              Add these records at your DNS provider. Verification usually completes within a few
              minutes after propagation.
              {status === "pending" ? " Status refreshes automatically every 30 seconds." : null}
            </p>
          </div>
          <DnsRecordsTable records={records} />
        </Card>
      ) : null}
    </div>
  )
}
