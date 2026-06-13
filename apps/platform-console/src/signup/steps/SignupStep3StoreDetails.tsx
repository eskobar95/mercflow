import { useMemo, useState } from "react"

import {
  SIGNUP_COUNTRY_OPTIONS,
  SIGNUP_CURRENCY_OPTIONS,
  SIGNUP_TIMEZONE_OPTIONS,
  validateSignupStoreDetails,
} from "@/lib/signupStoreOptions"
import { useSignupWizard } from "@/signup/SignupWizardContext"

export function SignupStep3StoreDetails(): React.ReactElement {
  const { state, updateStoreDetails, goToStep } = useSignupWizard()
  const [validationError, setValidationError] = useState<string | null>(null)

  const canContinue = useMemo(() => {
    return (
      validateSignupStoreDetails({
        storeName: state.storeName,
        currency: state.currency,
        country: state.country,
        timezone: state.timezone,
      }) === null
    )
  }, [state.country, state.currency, state.storeName, state.timezone])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const error = validateSignupStoreDetails({
      storeName: state.storeName,
      currency: state.currency,
      country: state.country,
      timezone: state.timezone,
    })

    if (error !== null) {
      setValidationError(error)
      return
    }

    setValidationError(null)
    goToStep(4)
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-surface-raised p-6">
      <h2 className="text-lg font-semibold text-content-primary">Store details</h2>
      <p className="mt-1 text-sm text-content-secondary">
        Tell us how your shop should appear in MercFlow.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-content-primary">Store name</span>
          <input
            className="rounded-md border border-border-subtle bg-surface-appCanvas px-3 py-2"
            value={state.storeName}
            onChange={(event) => {
              updateStoreDetails({ storeName: event.target.value })
            }}
            required
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-content-primary">Currency</span>
          <select
            className="rounded-md border border-border-subtle bg-surface-appCanvas px-3 py-2"
            value={state.currency}
            onChange={(event) => {
              updateStoreDetails({ currency: event.target.value })
            }}
            required
          >
            {SIGNUP_CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-content-primary">Country</span>
          <select
            className="rounded-md border border-border-subtle bg-surface-appCanvas px-3 py-2"
            value={state.country}
            onChange={(event) => {
              updateStoreDetails({ country: event.target.value })
            }}
            required
          >
            {SIGNUP_COUNTRY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-content-primary">Timezone</span>
          <select
            className="rounded-md border border-border-subtle bg-surface-appCanvas px-3 py-2"
            value={state.timezone}
            onChange={(event) => {
              updateStoreDetails({ timezone: event.target.value })
            }}
            required
          >
            {SIGNUP_TIMEZONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {validationError !== null ? (
          <p className="text-sm text-feedback-danger-content">{validationError}</p>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-md border border-border-subtle px-4 py-2 text-sm font-medium text-content-primary"
            onClick={() => {
              goToStep(2)
            }}
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!canContinue}
            className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse transition-opacity hover:bg-interactive-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </form>
    </section>
  )
}
