import { useCallback, useEffect, useId, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"


import { PageHeader } from "@/components/ui/PageHeader"
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import { Spinner } from "@/components/ui/Spinner"
import { CONNECTOR_CATALOG } from "@/features/connectors/connectorsCatalog"
import {
  type StripeConnectorDetailDto,
  type StripeConnectorSyncResultDto,
  type StripePaymentOverviewDto,
  getStripeConnectorDetail,
  getStripePayments,
  patchStripeConnector,
  postStripeConnectionTest,
  postStripeSyncProducts,
} from "@/features/connectors/stripeConnectorApi"

function formatStripeAmount(amountMinor: number, currencyCode: string): string {
  const major = amountMinor / 100
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode.toUpperCase(),
    }).format(major)
  } catch {
    return `${major.toFixed(2)} ${currencyCode.toUpperCase()}`
  }
}

function formatPaymentDate(epoch: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(epoch * 1000))
  } catch {
    return new Date(epoch * 1000).toISOString()
  }
}

export function StripeConnectorSettingsPage(): JSX.Element {
  const baseHintId = useId()

  const [loadState, setLoadState] = useState<
    { status: "idle" | "loading" } | { status: "error"; message: string } | { status: "ready" }
  >({ status: "idle" })

  const [detail, setDetail] = useState<StripeConnectorDetailDto | null>(null)
  const [payments, setPayments] = useState<StripePaymentOverviewDto[]>([])

  const [secretInput, setSecretInput] = useState("")
  const [publishInput, setPublishInput] = useState("")
  const [webhookInput, setWebhookInput] = useState("")

  const [saveState, setSaveState] = useState<
    | { status: "idle" }
    | { status: "working" }
    | { status: "error"; message: string }
    | { status: "success"; message: string }
  >({ status: "idle" })

  const [testState, setTestState] = useState<
    | { status: "idle" }
    | { status: "working" }
    | { status: "error"; message: string }
    | { status: "success"; message: string }
  >({ status: "idle" })

  const [syncState, setSyncState] = useState<
    | { status: "idle" }
    | { status: "working"; message: string }
    | { status: "error"; message: string }
    | { status: "success"; result: StripeConnectorSyncResultDto }
  >({ status: "idle" })

  const [vatSaving, setVatSaving] = useState(false)
  const [vatError, setVatError] = useState<string | null>(null)

  const refreshStripeData = useCallback(async (): Promise<void> => {
    setLoadState({ status: "loading" })
    try {
      const [detailRaw, pRows] = await Promise.all([
        getStripeConnectorDetail(),
        getStripePayments(20),
      ])
      if (detailRaw === null) {
        throw new TypeError("Stripe connector response could not be parsed.")
      }
      setDetail(detailRaw)
      setPayments(pRows)
      setLoadState({ status: "ready" })
    } catch (e) {
      setLoadState({
        status: "error",
        message: e instanceof Error ? e.message : "Unable to load Stripe connector.",
      })
    }
  }, [])

  useEffect(() => {
    void refreshStripeData()
  }, [refreshStripeData])

  const handleSaveCredentials = async (): Promise<void> => {
    const sk = secretInput.trim()
    const pk = publishInput.trim()
    const wh = webhookInput.trim()

    if (detail?.configured !== true && (sk === "" || pk === "")) {
      setSaveState({
        status: "error",
        message: "Provide both Stripe secret and publishable keys for the initial connection.",
      })
      return
    }

    if (sk === "" && pk === "" && wh === "") {
      setSaveState({
        status: "error",
        message: "Nothing changed — paste a rotated key before saving.",
      })
      return
    }

    setSaveState({ status: "working" })
    try {
      const patch: Parameters<typeof patchStripeConnector>[0] = {}
      if (sk !== "") patch.secret_key = sk
      if (pk !== "") patch.publishable_key = pk
      if (wh !== "") patch.webhook_secret = wh

      const next = await patchStripeConnector(patch)
      setDetail(next)
      setPublishInput("")
      setSecretInput("")
      setWebhookInput("")
      void refreshStripeData()
      setSaveState({ status: "success", message: "Stripe settings saved securely." })
    } catch (e) {
      setSaveState({
        status: "error",
        message: e instanceof Error ? e.message : "Saving credentials failed.",
      })
    }
  }

  const handleTest = async (): Promise<void> => {
    setTestState({ status: "working" })
    try {
      await postStripeConnectionTest()
      await refreshStripeData()
      setTestState({ status: "success", message: "Stripe accepted the credentials." })
    } catch (e) {
      setTestState({
        status: "error",
        message: e instanceof Error ? e.message : "Connection test failed.",
      })
    }
  }

  const handleSync = async (): Promise<void> => {
    setSyncState({
      status: "working",
      message: "Syncing Medusa products into Stripe via the Admin API …",
    })
    try {
      const result = await postStripeSyncProducts()
      setSyncState({ status: "success", result })
      await refreshStripeData()
    } catch (e) {
      setSyncState({
        status: "error",
        message:
          e instanceof Error ? e.message : "Synchronization failed — check Stripe + Medusa logs.",
      })
    }
  }

  const handleVatChange = async (value: StripeConnectorDetailDto["vat_mode"]): Promise<void> => {
    if (detail?.configured !== true) {
      setVatError("Save Stripe credentials before changing VAT behaviour.")
      return
    }

    setVatSaving(true)
    setVatError(null)

    try {
      const next = await patchStripeConnector({ vat_mode: value })
      setDetail(next)
    } catch (e) {
      setVatError(e instanceof Error ? e.message : "Unable to update VAT mode.")
    } finally {
      setVatSaving(false)
    }
  }

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
        <PageHeader title="Stripe" breadcrumbs={[]} />
        <Card className="mt-6 p-6">
          <p className="font-medium text-content-primary">Could not reach the backend.</p>
          <p className="mt-2 text-sm text-content-secondary">{loadState.message}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" shape="pill" type="button" onClick={() => void refreshStripeData()}>
              Try again
            </Button>
            <Link
              className="inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold text-content-secondary hover:text-content-primary"
              to="/settings/connectors"
            >
              Back to connectors
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
        breadcrumbs={[
          { label: "Connectors", href: "/settings/connectors" },
          { label: "Stripe", href: "/settings/connectors/stripe" },
        ]}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:max-w-5xl lg:gap-12">
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
                  setSecretInput(evt.target.value)
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
                onChange={(evt) => setPublishInput(evt.target.value)}
              />
            </FormField>

            <FormField label="Webhook signing secret" htmlFor="stripe-wh" hint={detail?.webhook_secret_masked ?? undefined}>
              <Input
                id="stripe-wh"
                type="password"
                autoComplete="off"
                value={webhookInput}
                placeholder={detail?.webhook_secret_masked ?? "whsec_..."}
                onChange={(evt) => setWebhookInput(evt.target.value)}
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
                onClick={() => void handleSaveCredentials()}
                disabled={saveState.status === "working"}
                leadingIcon={saveState.status === "working" ? <Spinner size="sm" label="Saving" /> : undefined}
              >
                Save connector
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => void handleTest()}
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

        <Card className="p-6 lg:p-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-content-primary">VAT behaviour</h2>
            <p className="text-sm text-content-secondary">
              Storefront integrations should query <code className="text-xs">GET /store/connectors/stripe/vat</code> for the
              authoritative flag (<code className="text-xs">vat_mode</code>).
            </p>
          </div>

          <div className="mt-6">
            <fieldset className="space-y-4" aria-describedby="vat-behaviour-hint">
              <legend className="sr-only">VAT inclusive or exclusive catalogue pricing</legend>
              <RadioGroup
                disabled={vatSaving || detail?.configured !== true}
                value={vatValue}
                onValueChange={(value) =>
                  value === "inclusive" || value === "exclusive" ? void handleVatChange(value) : undefined
                }
              >
                <RadioGroupItem
                  value="inclusive"
                  label="Inclusive — catalog/list prices already include VAT"
                  id="stripe-vat-inclusive"
                />
                <RadioGroupItem value="exclusive" label="Exclusive — VAT is added downstream" id="stripe-vat-exclusive" />
              </RadioGroup>
            </fieldset>

            <p id="vat-behaviour-hint" className="mt-4 text-xs text-content-tertiary">
              {vatSaving ? "Updating VAT preference…" : null}
              {vatError !== null ? <span className="text-feedback-danger-content">{vatError}</span> : null}
            </p>
          </div>
        </Card>

        <Card className="p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-prose">
              <h2 className="text-lg font-semibold text-content-primary">Product + price synchronization</h2>
              <p className="mt-2 text-sm text-content-secondary">
                Runs server-side inside Medusa, matching each Medusa product to a Stripe Product (metadata{" "}
                <code className="text-xs">medusa_product_id</code>) and each variant × currency combo to Stripe Prices via{" "}
                <code className="text-xs">metadata.medusa_variant_id</code>.
              </p>
            </div>

            <Button
              variant="secondary"
              type="button"
              disabled={detail?.configured !== true || syncState.status === "working"}
              onClick={() => void handleSync()}
              leadingIcon={syncState.status === "working" ? <Spinner size="sm" label="Syncing" /> : undefined}
            >
              Sync products now
            </Button>
          </div>

          {syncState.status === "working" ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-content-secondary">
              <Spinner size="sm" label="Stripe sync busy" aria-hidden /> {syncState.message}
            </p>
          ) : null}
          {syncState.status === "error" ? (
            <p role="alert" className="mt-4 text-sm text-feedback-danger-content">
              {syncState.message}
            </p>
          ) : null}
          {syncState.status === "success" ? (
            <p className="mt-4 text-sm text-feedback-success-content" aria-live="polite">
              Processed <strong>{syncState.result.products_processed}</strong> Medusa products; created Stripe products{" "}
              <strong>{syncState.result.stripe_products_created}</strong>, updates{" "}
              <strong>{syncState.result.stripe_products_updated}</strong>, Stripe prices{" "}
              <strong>{syncState.result.stripe_prices_created}</strong> (previous prices deactivated:{" "}
              <strong>{syncState.result.stripe_prices_deactivated}</strong>).
            </p>
          ) : null}
        </Card>

        <Card className="p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-content-primary">Recent Stripe payments</h2>
          <p className="mt-2 text-sm text-content-secondary">
            Mirrors the Stripe PaymentIntent list endpoint (latest {payments.length === 20 ? "20" : String(payments.length)}{" "}
            rows visible here).
          </p>

          {payments.length === 0 ? (
            <div className="mt-10 text-center">
              <p className="text-sm text-content-secondary">No payment intents fetched yet.</p>
            </div>
          ) : (
            <div className="mt-6 overflow-auto rounded-lg border border-border-default">
              <table className="min-w-full text-left text-sm text-content-secondary">
                <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-content-tertiary">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Amount
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Customer
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Stripe id
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-t border-border-subtle odd:bg-surface-default even:bg-surface-subtle"
                    >
                      <td className="px-4 py-3 font-medium text-content-primary">
                        {formatStripeAmount(payment.amountMinor, payment.currency)}
                      </td>
                      <td className="px-4 py-3">{payment.status.replaceAll("_", " ")}</td>
                      <td className="px-4 py-3">{payment.customerLabel ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{payment.id}</td>
                      <td className="px-4 py-3">{formatPaymentDate(payment.createdEpoch)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="flex gap-4">
          <Link
            className="text-sm font-semibold text-interactive-primary underline-offset-2 hover:underline"
            to="/settings/connectors"
          >
            ← Back to connectors
          </Link>
        </div>
      </div>
    </div>
  )
}
