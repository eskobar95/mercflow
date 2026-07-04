import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useUser } from "@clerk/react"

import { getStripePlatformPublishableKey } from "@/lib/signupBillingEnv"
import { createSignupBillingSetup, startSignupProvisioning } from "@/lib/signupProvisionApi"
import { resolveSignupDomain } from "@/lib/signupStoreOptions"
import { useSignupWizard } from "@/signup/SignupWizardContext"
import { PlanPicker } from "@/signup/steps/PlanPicker"

const stripePromise = (() => {
  const publishableKey = getStripePlatformPublishableKey()
  return publishableKey ? loadStripe(publishableKey) : null
})()

type BillingPaymentFormProps = {
  onError: (message: string | null) => void
}

function BillingPaymentForm({ onError }: BillingPaymentFormProps): React.ReactElement {
  const stripe = useStripe()
  const elements = useElements()
  const { state, setProvisioningDetails, goToStep } = useSignupWizard()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    if (!stripe || !elements) {
      onError("Stripe is still loading. Try again in a moment.")
      return
    }

    if (
      !state.inviteToken ||
      !state.clerkUserId ||
      !state.billing.paymentIntentId ||
      !state.billing.customerId ||
      !state.billing.subscriptionId
    ) {
      onError("Billing session is incomplete. Refresh and try again.")
      return
    }

    setIsSubmitting(true)
    onError(null)

    const domain = resolveSignupDomain({
      domainType: state.domainType,
      subdomain: state.subdomain,
      customDomain: state.customDomain,
    })

    const email = state.inviteEmail ?? ""
    if (!email) {
      onError("Invite email is missing.")
      setIsSubmitting(false)
      return
    }

    try {
      const confirmResult = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      })

      if (confirmResult.error) {
        onError(confirmResult.error.message ?? "Payment confirmation failed")
        setIsSubmitting(false)
        return
      }

      const provision = await startSignupProvisioning({
        invite_token: state.inviteToken,
        clerk_user_id: state.clerkUserId,
        store_name: state.storeName,
        domain,
        email,
        currency: state.currency,
        country: state.country,
        timezone: state.timezone,
        stripe_payment_intent_id: state.billing.paymentIntentId,
        stripe_customer_id: state.billing.customerId,
        stripe_subscription_id: state.billing.subscriptionId,
      })

      setProvisioningDetails({ jobId: provision.job_id })
      goToStep(6)
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to start provisioning")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
      <PaymentElement />
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md border border-border-subtle px-4 py-2 text-sm font-medium text-content-primary"
          onClick={() => {
            goToStep(4)
          }}
          disabled={isSubmitting}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || isSubmitting}
          className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse transition-opacity hover:bg-interactive-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Confirming payment…" : "Start subscription"}
        </button>
      </div>
    </form>
  )
}

export function SignupStep5Billing(): React.ReactElement {
  const { user } = useUser()
  const { state, setBillingDetails, goToStep } = useSignupWizard()
  const [error, setError] = useState<string | null>(null)
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null)
  const [isLoadingSetup, setIsLoadingSetup] = useState(false)
  const setupPriceIdRef = useRef<string | null>(null)

  useEffect(() => {
    setSelectedPriceId(null)
    setupPriceIdRef.current = null
    setBillingDetails({
      clientSecret: null,
      customerId: null,
      subscriptionId: null,
      paymentIntentId: null,
    })
  }, [setBillingDetails, state.currency])

  const handleSelectPriceId = useCallback((priceId: string): void => {
    setSelectedPriceId(priceId)
    setBillingDetails({
      clientSecret: null,
      customerId: null,
      subscriptionId: null,
      paymentIntentId: null,
    })
    setupPriceIdRef.current = null
  }, [setBillingDetails])

  const elementsOptions = useMemo<StripeElementsOptions | null>(() => {
    if (!state.billing.clientSecret) {
      return null
    }

    return {
      clientSecret: state.billing.clientSecret,
      appearance: {
        theme: "stripe",
      },
    }
  }, [state.billing.clientSecret])

  useEffect(() => {
    if (!selectedPriceId || state.billing.clientSecret || isLoadingSetup) {
      return
    }

    if (setupPriceIdRef.current === selectedPriceId) {
      return
    }

    const inviteToken = state.inviteToken
    const email = state.inviteEmail ?? user?.primaryEmailAddress?.emailAddress ?? ""
    if (!inviteToken || !email || !state.storeName) {
      return
    }

    let cancelled = false
    setupPriceIdRef.current = selectedPriceId
    setIsLoadingSetup(true)
    setError(null)

    void createSignupBillingSetup({
      invite_token: inviteToken,
      email,
      store_name: state.storeName,
      price_id: selectedPriceId,
    })
      .then((billing) => {
        if (cancelled) {
          return
        }

        setBillingDetails({
          clientSecret: billing.client_secret,
          customerId: billing.customer_id,
          subscriptionId: billing.subscription_id,
          paymentIntentId: billing.payment_intent_id,
        })
      })
      .catch((setupError: unknown) => {
        if (cancelled) {
          return
        }

        setupPriceIdRef.current = null
        setError(
          setupError instanceof Error
            ? setupError.message
            : "Failed to initialize billing",
        )
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSetup(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    isLoadingSetup,
    selectedPriceId,
    setBillingDetails,
    state.billing.clientSecret,
    state.inviteToken,
    state.inviteEmail,
    state.storeName,
    user?.primaryEmailAddress?.emailAddress,
  ])

  if (!stripePromise) {
    return (
      <section className="rounded-lg border border-border-subtle bg-surface-raised p-6">
        <p className="text-sm text-content-secondary">
          Set{" "}
          <code className="font-mono text-content-primary">
            VITE_STRIPE_PLATFORM_PUBLISHABLE_KEY
          </code>{" "}
          to enable platform billing.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-surface-raised p-6">
      <h2 className="text-lg font-semibold text-content-primary">Platform subscription</h2>
      <p className="mt-1 text-sm text-content-secondary">
        Choose your MercFlow plan, then add a payment method. Provisioning begins after
        payment succeeds.
      </p>

      <div className="mt-6">
        <PlanPicker
          currency={state.currency}
          selectedPriceId={selectedPriceId}
          onSelectPriceId={handleSelectPriceId}
        />
      </div>

      {selectedPriceId !== null ? (
        <div className="mt-6 border-t border-border-subtle pt-6">
          <h3 className="text-sm font-semibold text-content-primary">Payment method</h3>
          {isLoadingSetup || !elementsOptions ? (
            <p className="mt-3 text-sm text-content-secondary">Preparing secure checkout…</p>
          ) : (
            <div className="mt-4">
              <Elements stripe={stripePromise} options={elementsOptions}>
                <BillingPaymentForm onError={setError} />
              </Elements>
            </div>
          )}
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
