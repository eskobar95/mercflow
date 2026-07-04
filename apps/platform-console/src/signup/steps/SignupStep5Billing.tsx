import { useUser } from "@clerk/react"
import { flushSync } from "react-dom"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { isPublicSignupEnabled } from "@/lib/signupEnv"
import {
  buildSignupCheckoutCancelUrl,
  buildSignupCheckoutReturnUrl,
  clearSignupCheckoutState,
  loadSignupCheckoutState,
  persistCheckoutSessionId,
  persistSignupCheckoutState,
  resolveCheckoutSessionIdFromReturn,
} from "@/lib/signupCheckoutState"
import { createSignupBillingCheckout, completeSignupBillingCheckout } from "@/lib/signupProvisionApi"
import { resolveSignupDomain, validateSignupDomain, validateSignupStoreDetails } from "@/lib/signupStoreOptions"
import { useSignupWizard } from "@/signup/SignupWizardContext"
import { PlanPicker } from "@/signup/steps/PlanPicker"

export function SignupStep5Billing(): React.ReactElement {
  const { user, isLoaded: isUserLoaded } = useUser()
  const { state, goToStep } = useSignupWizard()
  const [error, setError] = useState<string | null>(null)
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    setSelectedPriceId(null)
  }, [state.currency])

  const handleContinueToCheckout = useCallback(async (): Promise<void> => {
    if (!selectedPriceId) {
      return
    }

    const inviteToken = state.inviteToken ?? ""
    const email = state.inviteEmail ?? user?.primaryEmailAddress?.emailAddress ?? ""
    const clerkUserId = state.clerkUserId ?? user?.id ?? null

    if (!email || !state.storeName.trim() || !clerkUserId) {
      setError("Missing account email, store name, or sign-in. Go back and complete earlier steps.")
      return
    }

    const storeError = validateSignupStoreDetails({
      storeName: state.storeName,
      currency: state.currency,
      country: state.country,
      timezone: state.timezone,
    })
    if (storeError !== null) {
      setError(`${storeError} Go back to store details.`)
      return
    }

    const domainDetails = {
      domainType: state.domainType,
      subdomain: state.subdomain,
      customDomain: state.customDomain,
    }
    const domainError = validateSignupDomain(domainDetails)
    if (domainError !== null) {
      setError(`${domainError} Go back to domain setup.`)
      return
    }

    if (!isPublicSignupEnabled() && inviteToken.length === 0) {
      setError("Invite token is required. Open the link from your invitation email.")
      return
    }

    setIsRedirecting(true)
    setError(null)

    const domain = resolveSignupDomain(domainDetails)

    try {
      const checkout = await createSignupBillingCheckout({
        invite_token: inviteToken,
        email,
        store_name: state.storeName.trim(),
        price_id: selectedPriceId,
        clerk_user_id: clerkUserId,
        domain,
        currency: state.currency,
        country: state.country,
        timezone: state.timezone,
        success_url: buildSignupCheckoutReturnUrl(),
        cancel_url: buildSignupCheckoutCancelUrl(),
      })

      persistCheckoutSessionId(checkout.session_id)
      persistSignupCheckoutState({
        inviteToken,
        clerkUserId,
        storeName: state.storeName,
        domainType: state.domainType,
        subdomain: state.subdomain,
        customDomain: state.customDomain,
        email,
        currency: state.currency,
        country: state.country,
        timezone: state.timezone,
        checkoutSessionId: checkout.session_id,
      })

      window.location.assign(checkout.checkout_url)
    } catch (checkoutError: unknown) {
      setIsRedirecting(false)
      clearSignupCheckoutState()
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Failed to start Stripe Checkout",
      )
    }
  }, [
    selectedPriceId,
    state.clerkUserId,
    state.country,
    state.currency,
    state.customDomain,
    state.domainType,
    state.inviteEmail,
    state.inviteToken,
    state.storeName,
    state.subdomain,
    state.timezone,
    user?.primaryEmailAddress?.emailAddress,
  ])

  return (
    <section className="rounded-lg border border-border-subtle bg-surface-raised p-6">
      <h2 className="text-lg font-semibold text-content-primary">Choose your plan</h2>
      <p className="mt-1 text-sm text-content-secondary">
        Pick the MercFlow plan that fits your store. Payment happens on Stripe&apos;s secure
        checkout page — the last step before we provision your store.
      </p>

      <div className="mt-6">
        <PlanPicker
          currency={state.currency}
          selectedPriceId={selectedPriceId}
          onSelectPriceId={setSelectedPriceId}
        />
      </div>

      {selectedPriceId !== null ? (
        <div className="mt-6 border-t border-border-subtle pt-6">
          <button
            type="button"
            disabled={!isUserLoaded || isRedirecting}
            onClick={() => {
              void handleContinueToCheckout()
            }}
            className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse transition-opacity hover:bg-interactive-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {!isUserLoaded
              ? "Loading account…"
              : isRedirecting
                ? "Redirecting to Stripe…"
                : "Continue to payment"}
          </button>
        </div>
      ) : null}

      {error !== null ? (
        <p className="mt-4 text-sm text-feedback-danger-content">{error}</p>
      ) : null}

      <button
        type="button"
        className="mt-4 text-sm text-content-secondary underline"
        onClick={() => {
          goToStep(4)
        }}
      >
        Back to domain
      </button>
    </section>
  )
}

export function SignupBillingReturnPage(): React.ReactElement {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setProvisioningDetails, goToStep } = useSignupWizard()
  const [error, setError] = useState<string | null>(null)
  const processedSessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    const persisted = loadSignupCheckoutState()
    const sessionId = resolveCheckoutSessionIdFromReturn(searchParams, persisted)

    if (sessionId === null) {
      setError("Missing Stripe checkout session. Return to plan selection and try again.")
      return
    }

    if (processedSessionIdRef.current === sessionId) {
      return
    }

    processedSessionIdRef.current = sessionId

    void (async (): Promise<void> => {
      try {
        const provision = await completeSignupBillingCheckout({
          checkout_session_id: sessionId,
        })

        flushSync(() => {
          setProvisioningDetails({ jobId: provision.job_id })
          goToStep(6)
        })
        navigate("/signup", { replace: true })
      } catch (provisionError: unknown) {
        processedSessionIdRef.current = null
        setError(
          provisionError instanceof Error
            ? provisionError.message
            : "Failed to start provisioning after payment",
        )
      }
    })()
  }, [goToStep, navigate, searchParams, setProvisioningDetails])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-semibold text-content-primary">Confirming payment…</h1>
      {error === null ? (
        <p className="text-sm text-content-secondary">
          Payment succeeded. Starting store provisioning — this only takes a moment.
        </p>
      ) : (
        <>
          <p className="text-sm text-feedback-danger-content">{error}</p>
          <a
            href="/signup?step=5"
            className="text-sm font-medium text-interactive-primary underline"
          >
            Back to plan selection
          </a>
        </>
      )}
    </div>
  )
}
