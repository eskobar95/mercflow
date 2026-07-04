import { useEffect, useRef, useState } from "react"

import {
  loadCheckoutSessionId,
  clearSignupCheckoutState,
} from "@/lib/signupCheckoutState"
import {
  completeSignupBillingCheckout,
  fetchProvisioningStatus,
  type ProvisioningJobState,
} from "@/lib/signupProvisionApi"
import { useSignupWizard } from "@/signup/SignupWizardContext"

const POLL_INTERVAL_MS = 2_000
const TIMEOUT_MS = 120_000

function StepStatusIcon({
  status,
}: {
  status: "pending" | "running" | "done" | "error"
}): React.ReactElement {
  if (status === "done") {
    return <span aria-hidden="true">✓</span>
  }

  if (status === "running") {
    return <span aria-hidden="true">…</span>
  }

  if (status === "error") {
    return <span aria-hidden="true">!</span>
  }

  return <span aria-hidden="true">○</span>
}

export function SignupStep6Provisioning(): React.ReactElement {
  const { state, setProvisioningDetails, goToStep } = useSignupWizard()
  const [error, setError] = useState<string | null>(null)
  const [isRecovering, setIsRecovering] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [jobState, setJobState] = useState<ProvisioningJobState | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(state.provisioning.jobId)
  const recoveryAttemptedRef = useRef(false)

  useEffect(() => {
    if (activeJobId) {
      return
    }

    if (recoveryAttemptedRef.current) {
      return
    }

    recoveryAttemptedRef.current = true
    const checkoutSessionId = loadCheckoutSessionId()

    if (!checkoutSessionId) {
      setError(
        "Provisioning has not started yet. Return to plan selection and complete payment again.",
      )
      return
    }

    setIsRecovering(true)
    setError(null)

    void completeSignupBillingCheckout({ checkout_session_id: checkoutSessionId })
      .then((provision) => {
        setProvisioningDetails({ jobId: provision.job_id })
        setActiveJobId(provision.job_id)
      })
      .catch((recoveryError: unknown) => {
        setError(
          recoveryError instanceof Error
            ? recoveryError.message
            : "Failed to resume provisioning after payment",
        )
      })
      .finally(() => {
        setIsRecovering(false)
      })
  }, [activeJobId, setProvisioningDetails])

  useEffect(() => {
    const jobId = activeJobId ?? state.provisioning.jobId
    if (!jobId) {
      return
    }

    const resolvedJobId = jobId

    let cancelled = false
    const startedAt = Date.now()

    async function poll(): Promise<void> {
      while (!cancelled) {
        const elapsed = Date.now() - startedAt
        const reachedTimeout = elapsed > TIMEOUT_MS

        try {
          const status = await fetchProvisioningStatus(resolvedJobId)
          if (cancelled) {
            return
          }

          setJobState(status)

          if (status.status === "completed") {
            clearSignupCheckoutState()
            setProvisioningDetails({
              tenantUrl: status.tenant_url,
              adminUrl: status.admin_url,
            })

            if (status.admin_url) {
              window.location.assign(status.admin_url)
              return
            }

            goToStep(7)
            return
          }

          if (status.status === "failed") {
            setError(status.error ?? "Provisioning failed")
            return
          }

          if (reachedTimeout) {
            setTimedOut(true)
            setError(
              status.error ??
                "Provisioning is taking longer than expected. Try again from plan selection.",
            )
            return
          }
        } catch (pollError) {
          if (!cancelled) {
            setError(
              pollError instanceof Error
                ? pollError.message
                : "Failed to load provisioning status",
            )
          }
          return
        }

        await new Promise((resolve) => {
          setTimeout(resolve, POLL_INTERVAL_MS)
        })
      }
    }

    void poll()

    return () => {
      cancelled = true
    }
  }, [activeJobId, goToStep, setProvisioningDetails, state.provisioning.jobId])

  const visibleSteps =
    jobState?.steps.filter((step) =>
      [
        "medusa_store",
        "clerk_org",
        "domain_routing",
        "welcome_email",
      ].includes(step.key),
    ) ?? []

  return (
    <section className="rounded-lg border border-border-subtle bg-surface-raised p-6">
      <h2 className="text-lg font-semibold text-content-primary">Setting up your store…</h2>
      <p className="mt-1 text-sm text-content-secondary">
        {isRecovering
          ? "Payment confirmed. Starting provisioning…"
          : "This usually finishes within a minute. Keep this tab open while we provision your infrastructure."}
      </p>

      <ul className="mt-6 grid gap-2 text-sm text-content-primary">
        {visibleSteps.length > 0 ? (
          visibleSteps.map((step) => (
            <li key={step.key} className="flex items-center gap-2">
              <StepStatusIcon status={step.status} />
              {step.label}
            </li>
          ))
        ) : (
          <>
            <li className="flex items-center gap-2">
              <StepStatusIcon status={isRecovering ? "running" : "pending"} />
              Medusa store
            </li>
            <li className="flex items-center gap-2">
              <StepStatusIcon status="pending" />
              Clerk organization
            </li>
            <li className="flex items-center gap-2">
              <StepStatusIcon status="pending" />
              Domain routing
            </li>
            <li className="flex items-center gap-2">
              <StepStatusIcon status="pending" />
              Welcome email
            </li>
          </>
        )}
      </ul>

      {timedOut ? (
        <p className="mt-4 text-sm text-feedback-warning-content">
          Timeout reached after 120 seconds.
        </p>
      ) : null}

      {error !== null ? (
        <div className="mt-4 grid gap-2">
          <p className="text-sm text-feedback-danger-content">{error}</p>
          <button
            type="button"
            className="text-left text-sm font-medium text-interactive-primary underline"
            onClick={() => {
              window.location.href = "/signup?step=5"
            }}
          >
            Try again from plan selection
          </button>
        </div>
      ) : null}
    </section>
  )
}
