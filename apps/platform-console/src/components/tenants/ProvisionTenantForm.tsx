import { useMemo, useState } from "react"

import type {
  ProvisionCompleteResult,
  ProvisionProgressEvent,
} from "@/lib/platformTenantsApi"
import { provisionPlatformTenantWithProgress } from "@/lib/platformTenantsApi"

type ProvisionTenantFormProps = {
  getToken: () => Promise<string | null>
  onComplete: (result: ProvisionCompleteResult) => void
}

const DEFAULT_FORM = {
  name: "",
  domain: "",
  email: "",
  currency: "dkk",
  timezone: "Europe/Copenhagen",
}

function progressLabel(event: ProvisionProgressEvent): string {
  return `[${event.status}] ${event.message}`
}

export function ProvisionTenantForm({
  getToken,
  onComplete,
}: ProvisionTenantFormProps): React.ReactElement {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progressLog, setProgressLog] = useState<ProvisionProgressEvent[]>([])
  const [result, setResult] = useState<ProvisionCompleteResult | null>(null)

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.domain.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.currency.trim().length === 3 &&
      !isSubmitting
    )
  }, [form, isSubmitting])

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    setProgressLog([])
    setResult(null)

    try {
      const completeResult = await provisionPlatformTenantWithProgress(
        {
          name: form.name.trim(),
          domain: form.domain.trim().toLowerCase(),
          email: form.email.trim(),
          currency: form.currency.trim().toLowerCase(),
          timezone: form.timezone.trim(),
        },
        getToken,
        (progressEvent) => {
          setProgressLog((current) => [...current, progressEvent])
        },
      )

      setResult(completeResult)
      onComplete(completeResult)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Tenant provisioning failed",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-surface-raised p-5">
      <h3 className="text-base font-semibold text-content-primary">
        Provision new tenant
      </h3>
      <p className="mt-1 text-sm text-content-secondary">
        Creates store, sales channel, publishable API key, admin user, and Traefik route.
      </p>

      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-content-primary">Shop name</span>
          <input
            className="rounded-md border border-border-subtle bg-surface-appCanvas px-3 py-2"
            value={form.name}
            onChange={(event) => {
              setForm((current) => ({ ...current, name: event.target.value }))
            }}
            required
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-content-primary">Domain</span>
          <input
            className="rounded-md border border-border-subtle bg-surface-appCanvas px-3 py-2"
            value={form.domain}
            onChange={(event) => {
              setForm((current) => ({ ...current, domain: event.target.value }))
            }}
            placeholder="shop.example.com"
            required
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-content-primary">Admin email</span>
          <input
            type="email"
            className="rounded-md border border-border-subtle bg-surface-appCanvas px-3 py-2"
            value={form.email}
            onChange={(event) => {
              setForm((current) => ({ ...current, email: event.target.value }))
            }}
            required
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-content-primary">Currency</span>
          <input
            className="rounded-md border border-border-subtle bg-surface-appCanvas px-3 py-2 uppercase"
            value={form.currency}
            onChange={(event) => {
              setForm((current) => ({ ...current, currency: event.target.value }))
            }}
            maxLength={3}
            required
          />
        </label>

        <label className="grid gap-1 text-sm md:col-span-2">
          <span className="font-medium text-content-primary">Timezone</span>
          <input
            className="rounded-md border border-border-subtle bg-surface-appCanvas px-3 py-2"
            value={form.timezone}
            onChange={(event) => {
              setForm((current) => ({ ...current, timezone: event.target.value }))
            }}
          />
        </label>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse transition-opacity hover:bg-interactive-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Provisioning…" : "Provision tenant"}
          </button>
        </div>
      </form>

      {error !== null ? (
        <p className="mt-4 text-sm text-feedback-danger-content">{error}</p>
      ) : null}

      {progressLog.length > 0 ? (
        <div className="mt-4 rounded-md border border-border-subtle bg-surface-appCanvas p-3">
          <h4 className="text-sm font-medium text-content-primary">Progress log</h4>
          <ul className="mt-2 space-y-1 font-mono text-xs text-content-secondary">
            {progressLog.map((entry, index) => (
              <li key={`${entry.step}-${index}`}>{progressLabel(entry)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result !== null ? (
        <div className="mt-4 rounded-md border border-border-subtle bg-surface-subtle p-3 text-sm">
          <h4 className="font-medium text-content-primary">Tenant summary</h4>
          <dl className="mt-2 grid gap-2 text-content-secondary">
            <div>
              <dt className="font-medium text-content-primary">Store ID</dt>
              <dd className="font-mono text-xs">{result.store_id}</dd>
            </div>
            <div>
              <dt className="font-medium text-content-primary">Publishable API key</dt>
              <dd className="flex items-center gap-2 font-mono text-xs">
                <span>{result.publishable_api_key}</span>
                <button
                  type="button"
                  className="rounded border border-border-subtle px-2 py-0.5 text-[11px]"
                  onClick={() => {
                    void navigator.clipboard.writeText(result.publishable_api_key)
                  }}
                >
                  Copy
                </button>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-content-primary">Admin login URL</dt>
              <dd>
                <a
                  className="text-accent-text underline"
                  href={result.admin_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {result.admin_url}
                </a>
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </section>
  )
}
