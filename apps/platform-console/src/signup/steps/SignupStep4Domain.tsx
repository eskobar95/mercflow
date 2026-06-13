import { useMemo, useState } from "react"

import {
  MERCFLOW_SUBDOMAIN_SUFFIX,
  resolveSignupDomain,
  validateSignupDomain,
} from "@/lib/signupStoreOptions"
import { useSignupWizard } from "@/signup/SignupWizardContext"

export function SignupStep4Domain(): React.ReactElement {
  const { state, updateDomainDetails, goToStep } = useSignupWizard()
  const [validationError, setValidationError] = useState<string | null>(null)

  const resolvedDomain = useMemo(() => {
    return resolveSignupDomain({
      domainType: state.domainType,
      subdomain: state.subdomain,
      customDomain: state.customDomain,
    })
  }, [state.customDomain, state.domainType, state.subdomain])

  const canContinue = useMemo(() => {
    return (
      validateSignupDomain({
        domainType: state.domainType,
        subdomain: state.subdomain,
        customDomain: state.customDomain,
      }) === null
    )
  }, [state.customDomain, state.domainType, state.subdomain])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const error = validateSignupDomain({
      domainType: state.domainType,
      subdomain: state.subdomain,
      customDomain: state.customDomain,
    })

    if (error !== null) {
      setValidationError(error)
      return
    }

    setValidationError(null)
    goToStep(5)
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-surface-raised p-6">
      <h2 className="text-lg font-semibold text-content-primary">Choose your domain</h2>
      <p className="mt-1 text-sm text-content-secondary">
        Pick a MercFlow subdomain or bring your own domain. DNS setup happens after signup.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium text-content-primary">Domain type</legend>
          <label className="flex items-center gap-2 text-sm text-content-primary">
            <input
              type="radio"
              name="domain-type"
              checked={state.domainType === "subdomain"}
              onChange={() => {
                updateDomainDetails({ domainType: "subdomain" })
              }}
            />
            MercFlow subdomain
          </label>
          <label className="flex items-center gap-2 text-sm text-content-primary">
            <input
              type="radio"
              name="domain-type"
              checked={state.domainType === "custom"}
              onChange={() => {
                updateDomainDetails({ domainType: "custom" })
              }}
            />
            Custom domain
          </label>
        </fieldset>

        {state.domainType === "subdomain" ? (
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-content-primary">Subdomain</span>
            <div className="flex items-center gap-2">
              <input
                className="min-w-0 flex-1 rounded-md border border-border-subtle bg-surface-appCanvas px-3 py-2"
                value={state.subdomain}
                onChange={(event) => {
                  updateDomainDetails({ subdomain: event.target.value })
                }}
                placeholder="kaffehuset"
                required
              />
              <span className="text-sm text-content-secondary">.{MERCFLOW_SUBDOMAIN_SUFFIX}</span>
            </div>
          </label>
        ) : (
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-content-primary">Custom domain</span>
            <input
              className="rounded-md border border-border-subtle bg-surface-appCanvas px-3 py-2"
              value={state.customDomain}
              onChange={(event) => {
                updateDomainDetails({ customDomain: event.target.value })
              }}
              placeholder="shop.example.com"
              required
            />
          </label>
        )}

        <div className="rounded-md border border-border-subtle bg-surface-subtle p-4 text-sm text-content-secondary">
          <h3 className="font-medium text-content-primary">DNS guidance</h3>
          {state.domainType === "subdomain" ? (
            <p className="mt-2">
              Your store will be available at{" "}
              <span className="font-mono text-content-primary">{resolvedDomain || `yourshop.${MERCFLOW_SUBDOMAIN_SUFFIX}`}</span>
              . No DNS changes are required for MercFlow subdomains.
            </p>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Add a CNAME record pointing{" "}
                <span className="font-mono text-content-primary">
                  {resolvedDomain || "shop.example.com"}
                </span>{" "}
                to MercFlow&apos;s ingress host.
              </li>
              <li>SSL activates automatically once DNS propagates (usually within an hour).</li>
              <li>
                You can finish billing first — domain verification continues in Store Admin →
                Settings → Domains.
              </li>
            </ul>
          )}
        </div>

        {validationError !== null ? (
          <p className="text-sm text-feedback-danger-content">{validationError}</p>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-md border border-border-subtle px-4 py-2 text-sm font-medium text-content-primary"
            onClick={() => {
              goToStep(3)
            }}
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!canContinue}
            className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse transition-opacity hover:bg-interactive-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to billing
          </button>
        </div>
      </form>
    </section>
  )
}
