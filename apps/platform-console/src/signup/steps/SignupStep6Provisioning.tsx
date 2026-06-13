import { useEffect, useState } from "react"

import {
  fetchProvisioningStatus,
  type ProvisioningJobState,
} from "@/lib/signupProvisionApi"
import { useSignupWizard } from "@/signup/SignupWizardContext"

const POLL_INTERVAL_MS = 2_000
const TIMEOUT_MS = 60_000

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
  const [timedOut, setTimedOut] = useState(false)
  const [jobState, setJobState] = useState<ProvisioningJobState | null>(null)

  useEffect(() => {
    const jobId = state.provisioning.jobId
    if (!jobId) {
      setError("Provisioning job id is missing.")
      return
    }

    const resolvedJobId = jobId

    let cancelled = false
    const startedAt = Date.now()

    async function poll(): Promise<void> {
      while (!cancelled) {
        if (Date.now() - startedAt > TIMEOUT_MS) {
          setTimedOut(true)
          setError("Provisioning is taking longer than expected. Contact MercFlow support.")
          return
        }

        try {
          const status = await fetchProvisioningStatus(resolvedJobId)
          if (cancelled) {
            return
          }

          setJobState(status)

          if (status.status === "completed") {
            setProvisioningDetails({
              tenantUrl: status.tenant_url,
              adminUrl: status.admin_url,
            })
            goToStep(7)
            return
          }

          if (status.status === "failed") {
            setError(status.error ?? "Provisioning failed")
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
  }, [goToStep, setProvisioningDetails, state.provisioning.jobId])

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
        This usually finishes within a minute. Keep this tab open while we provision
        your infrastructure.
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
              <StepStatusIcon status="running" />
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
          Timeout reached after 60 seconds.
        </p>
      ) : null}

      {error !== null ? (
        <p className="mt-4 text-sm text-feedback-danger-content">{error}</p>
      ) : null}
    </section>
  )
}
