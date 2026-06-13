import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { validatePlatformInviteToken } from "@/lib/platformInviteValidateApi"
import { isPublicSignupEnabled } from "@/lib/signupEnv"
import { SignupErrorPage } from "@/signup/SignupErrorPage"
import { useSignupWizard } from "@/signup/SignupWizardContext"

type SignupGateProps = {
  children: React.ReactNode
}

type GateState =
  | { status: "loading" }
  | { status: "blocked"; title: string; message: string; statusCode: number }
  | { status: "ready" }

export function SignupGate({ children }: SignupGateProps): React.ReactElement {
  const [searchParams] = useSearchParams()
  const { setInviteValidation } = useSignupWizard()
  const [gateState, setGateState] = useState<GateState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false

    async function runGate(): Promise<void> {
      if (isPublicSignupEnabled()) {
        setInviteValidation({ token: "", email: null })
        if (!cancelled) {
          setGateState({ status: "ready" })
        }
        return
      }

      const inviteToken = searchParams.get("invite")?.trim() ?? ""
      if (inviteToken.length === 0) {
        if (!cancelled) {
          setGateState({
            status: "blocked",
            statusCode: 403,
            title: "Invite required",
            message:
              "Sign up is invitation-only. Open the invite link from your email or contact MercFlow.",
          })
        }
        return
      }

      try {
        const result = await validatePlatformInviteToken(inviteToken)
        if (cancelled) {
          return
        }

        if (!result.valid) {
          setGateState({
            status: "blocked",
            statusCode: 403,
            title: "Invalid or expired invite",
            message:
              "This invite link is invalid or has expired. Ask your MercFlow contact for a new invite.",
          })
          return
        }

        setInviteValidation({ token: inviteToken, email: result.email })
        setGateState({ status: "ready" })
      } catch (error) {
        if (cancelled) {
          return
        }

        setGateState({
          status: "blocked",
          statusCode: 403,
          title: "Invalid or expired invite",
          message:
            error instanceof Error
              ? error.message
              : "Unable to validate invite link. Try again or request a new invite.",
        })
      }
    }

    void runGate()

    return () => {
      cancelled = true
    }
  }, [searchParams, setInviteValidation])

  if (gateState.status === "loading") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-appCanvas">
        <p className="text-sm text-content-secondary">Validating invite…</p>
      </div>
    )
  }

  if (gateState.status === "blocked") {
    return (
      <SignupErrorPage
        title={gateState.title}
        message={gateState.message}
        statusCode={gateState.statusCode}
      />
    )
  }

  return <>{children}</>
}
