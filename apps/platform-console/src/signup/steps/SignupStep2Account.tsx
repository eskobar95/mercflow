import { SignUp, useAuth, useUser } from "@clerk/react"
import { useEffect } from "react"

import { useSignupWizard } from "@/signup/SignupWizardContext"

export function SignupStep2Account(): React.ReactElement {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const { state, completeStep2 } = useSignupWizard()

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      return
    }

    if (state.clerkUserId === user.id && state.currentStep >= 3) {
      return
    }

    completeStep2(user.id)
  }, [completeStep2, isLoaded, isSignedIn, state.clerkUserId, state.currentStep, user])

  if (!isLoaded) {
    return <p className="text-sm text-content-secondary">Loading sign up…</p>
  }

  if (isSignedIn) {
    return (
      <p className="text-sm text-content-secondary">
        Account created. Continuing to store details…
      </p>
    )
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-surface-raised p-6">
      <h2 className="text-lg font-semibold text-content-primary">Create your account</h2>
      <p className="mt-1 text-sm text-content-secondary">
        Use the email from your invite
        {state.inviteEmail ? ` (${state.inviteEmail})` : ""}.
      </p>
      <div className="mt-6 flex justify-center">
        <SignUp routing="hash" />
      </div>
    </section>
  )
}
